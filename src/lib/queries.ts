import { prisma } from "@/lib/prisma";
import type { ConditionBand } from "@/lib/enums";

/**
 * Read-side data access for Stage 1. Keeps Prisma usage out of the page
 * components. Pure reads against the seeded data; writes arrive in Stage 2+.
 */

/** The signed-in user. Stage 1 has no auth — return the seeded dev user. */
export async function getCurrentUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("No user found — run `npm run db:seed`.");
  return user;
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
