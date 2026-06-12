import { PrismaClient } from "@prisma/client";
import { dollarsToCents, pricesFromNM } from "../src/lib/pricing";
import { SAMPLE_CARDS } from "../src/lib/providers/sample-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CardSwap…");

  // Catalog + price snapshots (one per condition band).
  // Prisma disallows null in a compound-unique `where`, so find-or-create by
  // the stable externalId instead of upserting on the natural key.
  for (const c of SAMPLE_CARDS) {
    const card =
      (await prisma.catalogCard.findFirst({
        where: { externalId: c.externalId },
      })) ??
      (await prisma.catalogCard.create({
        data: {
          externalId: c.externalId,
          game: c.game,
          set: c.set,
          number: c.number,
          name: c.name,
          variant: c.variant ?? null,
          finish: c.finish ?? null,
          imageUrl: c.imageUrl ?? null,
          description: c.description ?? null,
          rarity: c.rarity ?? null,
          cardType: c.cardType ?? null,
          cost: c.cost ?? null,
          power: c.power ?? null,
          counter: c.counter ?? null,
        },
      }));

    const prices = pricesFromNM(dollarsToCents(c.valueAudNM));
    for (const [band, valueCents] of Object.entries(prices)) {
      await prisma.priceSnapshot.upsert({
        where: {
          catalogCardId_conditionBand_source: {
            catalogCardId: card.id,
            conditionBand: band,
            source: "MOCK",
          },
        },
        update: { valueCents, capturedAt: new Date() },
        create: {
          catalogCardId: card.id,
          conditionBand: band,
          valueCents,
          source: "MOCK",
        },
      });
    }
  }

  // Two dev users (no auth yet — Auth.js arrives in Stage 5) so the two-sided
  // trade flows in Stage 3 can be exercised via the dev user-switcher.
  async function seedUser(data: {
    displayName: string;
    email: string;
    trustTier: string;
    entityType: string;
    completedTradeValueCents: number;
    ratingAvg: number;
    // externalId → condition; all listed HAVE so they show in the marketplace.
    owns: Record<string, "NM" | "LP" | "PL" | "PO">;
  }) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { entityType: data.entityType },
      create: {
        displayName: data.displayName,
        email: data.email,
        region: "AU",
        trustTier: data.trustTier,
        kycStatus: "VERIFIED",
        entityType: data.entityType,
        completedTradeValueCents: data.completedTradeValueCents,
        ratingAvg: data.ratingAvg,
      },
    });

    for (const [externalId, condition] of Object.entries(data.owns)) {
      const catalogCard = await prisma.catalogCard.findFirst({
        where: { externalId },
      });
      if (!catalogCard) continue;
      const existing = await prisma.inventoryCard.findFirst({
        where: { ownerId: user.id, catalogCardId: catalogCard.id },
      });
      if (existing) continue;
      const inv = await prisma.inventoryCard.create({
        data: {
          ownerId: user.id,
          catalogCardId: catalogCard.id,
          condition,
          status: "LISTED",
        },
      });
      await prisma.listing.create({
        data: { userId: user.id, type: "HAVE", inventoryCardId: inv.id },
      });
    }
  }

  await seedUser({
    displayName: "Ash K.",
    email: "ash@cardswap.dev",
    trustTier: "L3",
    entityType: "TRADER",
    completedTradeValueCents: 8000,
    ratingAvg: 4.8,
    owns: {
      "base1-4": "NM", // Charizard
      "base1-58": "LP", // Pikachu
      "OP01-001": "NM", // Zoro
      "OP01-120": "NM", // Luffy alt-art
    },
  });

  await seedUser({
    displayName: "Misty W.",
    email: "misty@cardswap.dev",
    trustTier: "X1",
    entityType: "VENDOR",
    completedTradeValueCents: 20000,
    ratingAvg: 4.9,
    owns: {
      "base1-2": "NM", // Blastoise
      "base1-15": "NM", // Venusaur
      "base1-10": "LP", // Mewtwo
      "base1-14": "NM", // Raichu
      "OP13-001": "NM", // Luffy leader (unpriced in live mode)
    },
  });

  // Seed a couple of completed trades so profile metrics populate. These are
  // historical records (Offer ACCEPTED + Trade + OfferItems); inventory statuses
  // are left as-is (ownership transfer / locking is a settlement-stage concern).
  const userByEmail = async (e: string) =>
    prisma.user.findFirstOrThrow({ where: { email: e } });
  const invOf = async (email: string, externalId: string) => {
    const u = await userByEmail(email);
    return prisma.inventoryCard.findFirstOrThrow({
      where: { ownerId: u.id, catalogCard: { externalId } },
    });
  };
  const valueOf = async (inv: { catalogCardId: string; condition: string }) =>
    (
      await prisma.priceSnapshot.findFirst({
        where: { catalogCardId: inv.catalogCardId, conditionBand: inv.condition, source: "MOCK" },
      })
    )?.valueCents ?? 0;

  type Inv = { id: string; catalogCardId: string; condition: string };
  async function seedTrade(initiatorEmail: string, responderEmail: string, offered: Inv[], requested: Inv[]) {
    const initiator = await userByEmail(initiatorEmail);
    const responder = await userByEmail(responderEmail);
    const offeredVals = await Promise.all(offered.map(valueOf));
    const requestedVals = await Promise.all(requested.map(valueOf));
    const offeredValueCents = offeredVals.reduce((a, b) => a + b, 0);
    const requestedValueCents = requestedVals.reduce((a, b) => a + b, 0);
    // Skip if a trade already links these exact offered cards (idempotent reseed).
    const existing = await prisma.offer.findFirst({
      where: { initiatorId: initiator.id, responderId: responder.id, state: "ACCEPTED" },
    });
    if (existing) return;
    const offer = await prisma.offer.create({
      data: {
        state: "ACCEPTED",
        initiatorId: initiator.id,
        responderId: responder.id,
        offeredValueCents,
        requestedValueCents,
        items: {
          create: [
            ...offered.map((c, i) => ({ side: "OFFERED", inventoryCardId: c.id, valueCents: offeredVals[i] })),
            ...requested.map((c, i) => ({ side: "REQUESTED", inventoryCardId: c.id, valueCents: requestedVals[i] })),
          ],
        },
      },
    });
    await prisma.trade.create({
      data: { offerId: offer.id, status: "DELIVERED", offeredValueCents, requestedValueCents },
    });
  }

  await seedTrade(
    "ash@cardswap.dev",
    "misty@cardswap.dev",
    [await invOf("ash@cardswap.dev", "base1-58")], // Ash gives Pikachu (Pokémon)
    [await invOf("misty@cardswap.dev", "base1-14")], // for Misty's Raichu (Pokémon)
  );
  await seedTrade(
    "misty@cardswap.dev",
    "ash@cardswap.dev",
    [await invOf("misty@cardswap.dev", "base1-10")], // Misty gives Mewtwo (Pokémon)
    [await invOf("ash@cardswap.dev", "OP01-001")], // for Ash's Zoro (One Piece)
  );

  const counts = {
    users: await prisma.user.count(),
    catalog: await prisma.catalogCard.count(),
    prices: await prisma.priceSnapshot.count(),
    inventory: await prisma.inventoryCard.count(),
    listings: await prisma.listing.count(),
  };
  console.log("Done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
