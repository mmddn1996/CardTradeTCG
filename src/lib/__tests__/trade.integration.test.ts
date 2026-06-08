import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { acceptOffer, createOffer } from "@/lib/trade";

/**
 * Engine integration tests against the dev SQLite DB. They create fully
 * isolated, tagged data and remove it afterward, so they neither depend on nor
 * disturb the seeded demo data. Covers the §5.6 integrity rules that the pure
 * unit tests can't: ownership/pricing validation, two-phase accept with
 * hard-locking, Trade creation, and conflicting-offer auto-rejection.
 */

const LO = "ITEST-LO";
const HI = "ITEST-HI";
const EMAIL_A = "a@itest.cardswap";
const EMAIL_B = "b@itest.cardswap";

const ids: Record<string, string> = {};

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length) {
    await prisma.trade.deleteMany({ where: { offer: { initiatorId: { in: userIds } } } });
    await prisma.offer.deleteMany({ where: { initiatorId: { in: userIds } } });
    await prisma.listing.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.inventoryCard.deleteMany({ where: { ownerId: { in: userIds } } });
  }
  await prisma.priceSnapshot.deleteMany({
    where: { catalogCard: { externalId: { in: [LO, HI] } } },
  });
  await prisma.catalogCard.deleteMany({ where: { externalId: { in: [LO, HI] } } });
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
}

async function priced(externalId: string, valueCents: number) {
  const card = await prisma.catalogCard.create({
    data: { externalId, game: "POKEMON", set: "Itest", number: externalId, name: externalId },
  });
  await prisma.priceSnapshot.create({
    data: { catalogCardId: card.id, conditionBand: "NM", valueCents, source: "MOCK" },
  });
  return card;
}

async function inv(ownerId: string, catalogCardId: string) {
  const card = await prisma.inventoryCard.create({
    data: { ownerId, catalogCardId, condition: "NM", status: "LISTED" },
  });
  await prisma.listing.create({
    data: { userId: ownerId, type: "HAVE", inventoryCardId: card.id },
  });
  return card.id;
}

beforeAll(async () => {
  await cleanup();
  const a = await prisma.user.create({
    data: { displayName: "Itest A", email: EMAIL_A, trustTier: "X1", kycStatus: "VERIFIED" },
  });
  const b = await prisma.user.create({
    data: { displayName: "Itest B", email: EMAIL_B, trustTier: "X1", kycStatus: "VERIFIED" },
  });
  ids.a = a.id;
  ids.b = b.id;
  const lo = await priced(LO, 1000);
  const hi = await priced(HI, 5000);
  ids.loCatalog = lo.id;
  ids.aLo1 = await inv(a.id, lo.id);
  ids.aLo2 = await inv(a.id, lo.id);
  ids.aHi = await inv(a.id, hi.id);
  ids.bLo1 = await inv(b.id, lo.id);
  ids.bLo2 = await inv(b.id, lo.id);
});

afterAll(cleanup);

describe("createOffer validation", () => {
  it("rejects trading with yourself", async () => {
    const r = await createOffer({
      initiatorId: ids.a,
      responderId: ids.a,
      offeredCardIds: [ids.aLo1],
      requestedCardIds: [ids.aLo2],
    });
    expect(r.ok).toBe(false);
  });

  it("gates a >15% overpay until acknowledged (Spec §5.5)", async () => {
    const base = {
      initiatorId: ids.a,
      responderId: ids.b,
      offeredCardIds: [ids.aHi], // $50
      requestedCardIds: [ids.bLo2], // $10
    };
    const blocked = await createOffer(base);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.needsOverpayConfirm).toBe(true);

    const ok = await createOffer({ ...base, overpayAcknowledged: true });
    expect(ok.ok).toBe(true);
  });
});

describe("acceptOffer two-phase commit + locking (Spec §5.6)", () => {
  it("locks both baskets, creates a Trade, and reverts conflicting offers", async () => {
    const offer1 = await createOffer({
      initiatorId: ids.a,
      responderId: ids.b,
      offeredCardIds: [ids.aLo1],
      requestedCardIds: [ids.bLo1],
    });
    const offer2 = await createOffer({
      initiatorId: ids.a,
      responderId: ids.b,
      offeredCardIds: [ids.aLo1], // also references aLo1 → conflicts with offer1
      requestedCardIds: [ids.bLo1, ids.bLo2],
    });
    expect(offer1.ok && offer2.ok).toBe(true);
    if (!offer1.ok || !offer2.ok) return;

    const accept = await acceptOffer({ offerId: offer1.offerId, byUserId: ids.b });
    expect(accept.ok).toBe(true);

    const aLo1 = await prisma.inventoryCard.findUnique({ where: { id: ids.aLo1 } });
    const bLo1 = await prisma.inventoryCard.findUnique({ where: { id: ids.bLo1 } });
    expect(aLo1?.status).toBe("LOCKED");
    expect(bLo1?.status).toBe("LOCKED");

    const trade = await prisma.trade.findUnique({ where: { offerId: offer1.offerId } });
    expect(trade).not.toBeNull();

    const o1 = await prisma.offer.findUnique({ where: { id: offer1.offerId } });
    const o2 = await prisma.offer.findUnique({ where: { id: offer2.offerId } });
    expect(o1?.state).toBe("ACCEPTED");
    expect(o2?.state).toBe("REJECTED"); // conflicting offer auto-reverted
  });

  it("lets a counter request the other party's VAULT card already on the table", async () => {
    // A offers a VAULT card (not listed) for B's listed card.
    const vault = await prisma.inventoryCard.create({
      data: { ownerId: ids.a, catalogCardId: ids.loCatalog, condition: "NM", status: "VAULT" },
    });
    const original = await createOffer({
      initiatorId: ids.a,
      responderId: ids.b,
      offeredCardIds: [vault.id],
      requestedCardIds: [ids.bLo2],
    });
    expect(original.ok).toBe(true);
    if (!original.ok) return;

    // B counters, requesting A's VAULT card (which is on the table, not listed).
    const counter = await createOffer({
      initiatorId: ids.b,
      responderId: ids.a,
      offeredCardIds: [ids.bLo2],
      requestedCardIds: [vault.id],
      parentOfferId: original.offerId,
    });
    expect(counter.ok).toBe(true); // previously failed: "no longer listed"
  });

  it("won't let the initiator accept their own offer", async () => {
    const offer = await createOffer({
      initiatorId: ids.a,
      responderId: ids.b,
      offeredCardIds: [ids.aLo2],
      requestedCardIds: [ids.bLo2],
    });
    expect(offer.ok).toBe(true);
    if (!offer.ok) return;
    const r = await acceptOffer({ offerId: offer.offerId, byUserId: ids.a });
    expect(r.ok).toBe(false);
  });
});
