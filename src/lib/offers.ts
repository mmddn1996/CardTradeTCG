import "server-only";
import type { ConditionBand } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getCardValue } from "@/lib/queries";

export interface SelectableCard {
  inventoryCardId: string;
  catalogId: string;
  name: string;
  set: string;
  number: string;
  game: string;
  finish: string | null;
  imageUrl: string | null;
  condition: string;
  valueCents: number;
}

async function toSelectable(items: {
  id: string;
  condition: string;
  catalogCard: {
    id: string;
    name: string;
    set: string;
    number: string;
    game: string;
    finish: string | null;
    imageUrl: string | null;
  };
}[]): Promise<SelectableCard[]> {
  const out: SelectableCard[] = [];
  for (const i of items) {
    const v = await getCardValue(i.catalogCard.id, i.condition as ConditionBand);
    if (!v) continue; // unpriced cards can't be offered (Spec §4.6)
    out.push({
      inventoryCardId: i.id,
      catalogId: i.catalogCard.id,
      name: i.catalogCard.name,
      set: i.catalogCard.set,
      number: i.catalogCard.number,
      game: i.catalogCard.game,
      finish: i.catalogCard.finish,
      imageUrl: i.catalogCard.imageUrl,
      condition: i.condition,
      valueCents: v.valueCents,
    });
  }
  return out;
}

/** Cards available to build offers: your non-locked priced cards (to give) and
 * the counterparty's listed (HAVE) priced cards (to request). */
export async function getBuilderData(youId: string, themId: string) {
  const [yours, theirs] = await Promise.all([
    prisma.inventoryCard.findMany({
      where: { ownerId: youId, status: { not: "LOCKED" } },
      include: { catalogCard: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryCard.findMany({
      where: { ownerId: themId, status: "LISTED" },
      include: { catalogCard: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    yourCards: await toSelectable(yours),
    theirCards: await toSelectable(theirs),
  };
}

export async function getInventoryOwner(inventoryCardId: string) {
  return prisma.inventoryCard.findUnique({
    where: { id: inventoryCardId },
    select: { id: true, ownerId: true, status: true },
  });
}

export interface OfferItemView extends SelectableCard {
  side: "OFFERED" | "REQUESTED";
}

export interface OfferDetail {
  id: string;
  state: string;
  message: string | null;
  createdAt: Date;
  parentOfferId: string | null;
  initiator: { id: string; name: string; trustTier: string };
  responder: { id: string; name: string; trustTier: string };
  offered: OfferItemView[];
  requested: OfferItemView[];
  offeredValueCents: number;
  requestedValueCents: number;
}

/** Full offer with both baskets and **live** values (delta updates as prices
 * move, Spec §5.5). */
export async function getOfferDetail(offerId: string): Promise<OfferDetail | null> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      initiator: true,
      responder: true,
      items: { include: { inventoryCard: { include: { catalogCard: true } } } },
    },
  });
  if (!offer) return null;

  const views: OfferItemView[] = [];
  for (const it of offer.items) {
    const c = it.inventoryCard;
    const v = await getCardValue(c.catalogCardId, c.condition as ConditionBand);
    views.push({
      side: it.side as "OFFERED" | "REQUESTED",
      inventoryCardId: c.id,
      catalogId: c.catalogCard.id,
      name: c.catalogCard.name,
      set: c.catalogCard.set,
      number: c.catalogCard.number,
      game: c.catalogCard.game,
      finish: c.catalogCard.finish,
      imageUrl: c.catalogCard.imageUrl,
      condition: c.condition,
      valueCents: v?.valueCents ?? it.valueCents,
    });
  }
  const offered = views.filter((v) => v.side === "OFFERED");
  const requested = views.filter((v) => v.side === "REQUESTED");
  return {
    id: offer.id,
    state: offer.state,
    message: offer.message,
    createdAt: offer.createdAt,
    parentOfferId: offer.parentOfferId,
    initiator: { id: offer.initiator.id, name: offer.initiator.displayName, trustTier: offer.initiator.trustTier },
    responder: { id: offer.responder.id, name: offer.responder.displayName, trustTier: offer.responder.trustTier },
    offered,
    requested,
    offeredValueCents: offered.reduce((t, v) => t + v.valueCents, 0),
    requestedValueCents: requested.reduce((t, v) => t + v.valueCents, 0),
  };
}

export interface OfferSummary {
  id: string;
  state: string;
  direction: "INCOMING" | "OUTGOING";
  counterpartyName: string;
  offeredValueCents: number;
  requestedValueCents: number;
  offeredCount: number;
  requestedCount: number;
  createdAt: Date;
}

function summarize(
  offer: {
    id: string;
    state: string;
    initiatorId: string;
    responderId: string;
    initiator: { displayName: string };
    responder: { displayName: string };
    offeredValueCents: number;
    requestedValueCents: number;
    items: { side: string }[];
    createdAt: Date;
  },
  userId: string,
): OfferSummary {
  const outgoing = offer.initiatorId === userId;
  return {
    id: offer.id,
    state: offer.state,
    direction: outgoing ? "OUTGOING" : "INCOMING",
    counterpartyName: outgoing ? offer.responder.displayName : offer.initiator.displayName,
    offeredValueCents: offer.offeredValueCents,
    requestedValueCents: offer.requestedValueCents,
    offeredCount: offer.items.filter((i) => i.side === "OFFERED").length,
    requestedCount: offer.items.filter((i) => i.side === "REQUESTED").length,
    createdAt: offer.createdAt,
  };
}

export async function listOffersForUser(userId: string) {
  const offers = await prisma.offer.findMany({
    where: { OR: [{ initiatorId: userId }, { responderId: userId }] },
    include: { initiator: true, responder: true, items: { select: { side: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const summaries = offers.map((o) => summarize(o, userId));
  return {
    incoming: summaries.filter((s) => s.direction === "INCOMING" && s.state === "PENDING"),
    outgoing: summaries.filter(
      (s) => s.direction === "OUTGOING" && (s.state === "PENDING" || s.state === "COUNTERED"),
    ),
    concluded: summaries
      .filter((s) => ["ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"].includes(s.state))
      .slice(0, 20),
  };
}

/** Inventory cards currently soft-locked (in a pending offer) — shown as
 * "in an active offer" on listings (Spec §5.6). */
export async function getSoftLockedInventoryIds(): Promise<Set<string>> {
  const items = await prisma.offerItem.findMany({
    where: { offer: { state: "PENDING" } },
    select: { inventoryCardId: true },
  });
  return new Set(items.map((i) => i.inventoryCardId));
}

export async function countIncomingOffers(userId: string): Promise<number> {
  return prisma.offer.count({ where: { responderId: userId, state: "PENDING" } });
}
