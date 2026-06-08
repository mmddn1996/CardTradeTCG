import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { ConditionBand } from "@/lib/enums";

/** Cookie holding the active user id. Dev-only stand-in for real auth, which
 * arrives in Stage 5. Lets us switch between seeded users to exercise the
 * two-sided trade flows. */
export const USER_COOKIE = "cardswap_uid";

/**
 * Read-side data access for Stage 1. Keeps Prisma usage out of the page
 * components. Pure reads against the seeded data; writes arrive in Stage 2+.
 */

/** The active user. No real auth yet (Stage 5) — resolve from the dev cookie,
 * falling back to the first seeded user. */
export async function getCurrentUser() {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  if (id) {
    const picked = await prisma.user.findUnique({ where: { id } });
    if (picked) return picked;
  }
  const first = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!first) throw new Error("No user found — run `npm run db:seed`.");
  return first;
}

export async function getAllUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export interface CardValue {
  valueCents: number;
  source: string;
  capturedAt: Date;
}

/** Latest price snapshot for a card at a given condition band (Spec §4.5). */
export async function getCardValue(
  catalogCardId: string,
  band: ConditionBand,
): Promise<CardValue | null> {
  const snap = await prisma.priceSnapshot.findFirst({
    where: { catalogCardId, conditionBand: band },
    orderBy: { capturedAt: "desc" },
  });
  return snap
    ? { valueCents: snap.valueCents, source: snap.source, capturedAt: snap.capturedAt }
    : null;
}

export async function getInventoryForUser(userId: string) {
  const items = await prisma.inventoryCard.findMany({
    where: { ownerId: userId },
    include: { catalogCard: true, listing: true },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      value: await getCardValue(item.catalogCardId, item.condition as ConditionBand),
    })),
  );
}

/** Public HAVE listings across all users (the marketplace browse, Spec §1). */
export async function getMarketplaceListings() {
  const listings = await prisma.listing.findMany({
    where: { type: "HAVE", inventoryCard: { isNot: null } },
    include: {
      user: true,
      inventoryCard: { include: { catalogCard: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    listings.map(async (l) => ({
      ...l,
      value: l.inventoryCard
        ? await getCardValue(
            l.inventoryCard.catalogCardId,
            l.inventoryCard.condition as ConditionBand,
          )
        : null,
    })),
  );
}

export async function getCatalogCard(id: string) {
  return prisma.catalogCard.findUnique({
    where: { id },
    include: { prices: { orderBy: { capturedAt: "desc" } } },
  });
}

export async function getCatalogGaps() {
  return prisma.catalogGap.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDashboardStats(userId: string) {
  const inventory = await getInventoryForUser(userId);
  const collectionValueCents = inventory.reduce(
    (sum, i) => sum + (i.value?.valueCents ?? 0),
    0,
  );
  return {
    cardCount: inventory.length,
    listedCount: inventory.filter((i) => i.status === "LISTED").length,
    collectionValueCents,
    catalogSize: await prisma.catalogCard.count(),
  };
}
