import "server-only";
import type { ConditionBand, TrustTier } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getCardValue } from "@/lib/queries";
import { checkTierCeiling } from "@/lib/trust";
import { overpayExceeds, volatilityExceeds } from "@/lib/value-rules";

export type EngineResult =
  | { ok: true; offerId: string }
  | {
      ok: false;
      error: string;
      needsOverpayConfirm?: boolean;
      needsReconfirm?: boolean;
    };

interface CardWithValue {
  id: string;
  ownerId: string;
  status: string;
  condition: string;
  catalogCardId: string;
  valueCents: number | null;
}

async function loadCards(ids: string[]): Promise<CardWithValue[]> {
  if (ids.length === 0) return [];
  const cards = await prisma.inventoryCard.findMany({ where: { id: { in: ids } } });
  return Promise.all(
    cards.map(async (c) => ({
      id: c.id,
      ownerId: c.ownerId,
      status: c.status,
      condition: c.condition,
      catalogCardId: c.catalogCardId,
      valueCents:
        (await getCardValue(c.catalogCardId, c.condition as ConditionBand))
          ?.valueCents ?? null,
    })),
  );
}

const sum = (cards: CardWithValue[]) =>
  cards.reduce((t, c) => t + (c.valueCents ?? 0), 0);

/**
 * Validate a basket against ownership, availability and pricing. Requested
 * cards (the counterparty's) must be live, unlocked HAVE listings (Spec §5.3);
 * offered cards (the actor's own) must simply be available. Unpriced cards
 * cannot be offered (Spec §4.6).
 */
function validateBasket(
  cards: CardWithValue[],
  expectedOwnerId: string,
  ids: string[],
  opts: { requireListed: boolean },
): string | null {
  if (cards.length !== ids.length) return "Some cards no longer exist.";
  for (const c of cards) {
    if (c.ownerId !== expectedOwnerId)
      return "A card is no longer owned by the expected user.";
    if (c.status === "LOCKED") return "A card is locked in another trade.";
    if (opts.requireListed && c.status !== "LISTED")
      return "A requested card is no longer listed for trade.";
    if (c.valueCents == null)
      return "An unpriced card can't be part of an offer (Spec §4.6).";
  }
  return null;
}

/**
 * Create/send an offer (or a counter-offer when parentOfferId is set). The
 * actor is always the initiator of the new offer; their basket is OFFERED, the
 * counterparty's is REQUESTED. The acting (overpaying) side must acknowledge a
 * >15% imbalance before sending (Spec §5.5).
 */
export async function createOffer(input: {
  initiatorId: string;
  responderId: string;
  offeredCardIds: string[];
  requestedCardIds: string[];
  message?: string;
  parentOfferId?: string;
  overpayAcknowledged?: boolean;
}): Promise<EngineResult> {
  const { initiatorId, responderId } = input;
  if (initiatorId === responderId)
    return { ok: false, error: "You can't trade with yourself." };
  if (input.offeredCardIds.length === 0 || input.requestedCardIds.length === 0)
    return { ok: false, error: "Both sides of the trade need at least one card." };

  const offered = await loadCards(input.offeredCardIds);
  const requested = await loadCards(input.requestedCardIds);

  const offErr = validateBasket(offered, initiatorId, input.offeredCardIds, {
    requireListed: false,
  });
  if (offErr) return { ok: false, error: offErr };
  const reqErr = validateBasket(requested, responderId, input.requestedCardIds, {
    requireListed: true,
  });
  if (reqErr) return { ok: false, error: reqErr };

  const offeredValue = sum(offered);
  const requestedValue = sum(requested);

  // Initiator gives `offeredValue`, receives `requestedValue`.
  if (
    overpayExceeds(offeredValue, requestedValue) &&
    !input.overpayAcknowledged
  ) {
    return {
      ok: false,
      needsOverpayConfirm: true,
      error: `You're giving ~$${(offeredValue / 100).toFixed(0)} and receiving ~$${(
        requestedValue / 100
      ).toFixed(0)}. Continue anyway?`,
    };
  }

  if (input.parentOfferId) {
    const parent = await prisma.offer.findUnique({
      where: { id: input.parentOfferId },
    });
    if (!parent || parent.state !== "PENDING")
      return { ok: false, error: "This negotiation is no longer open." };
  }

  const offer = await prisma.$transaction(async (tx) => {
    if (input.parentOfferId) {
      await tx.offer.update({
        where: { id: input.parentOfferId },
        data: { state: "COUNTERED" },
      });
    }
    return tx.offer.create({
      data: {
        state: "PENDING",
        initiatorId,
        responderId,
        parentOfferId: input.parentOfferId ?? null,
        message: input.message ?? null,
        offeredValueCents: offeredValue,
        requestedValueCents: requestedValue,
        items: {
          create: [
            ...offered.map((c) => ({
              side: "OFFERED",
              inventoryCardId: c.id,
              valueCents: c.valueCents ?? 0,
            })),
            ...requested.map((c) => ({
              side: "REQUESTED",
              inventoryCardId: c.id,
              valueCents: c.valueCents ?? 0,
            })),
          ],
        },
      },
    });
  });

  return { ok: true, offerId: offer.id };
}

/**
 * Accept an offer (Spec §5.5 two-phase commit): re-price, re-check volatility,
 * re-validate ownership/availability, enforce the trust-tier ceiling, gate the
 * overpaying acceptor, then atomically hard-lock the cards, create the Trade,
 * and revert other pending offers that referenced any locked card (Spec §5.6).
 */
export async function acceptOffer(input: {
  offerId: string;
  byUserId: string;
  overpayAcknowledged?: boolean;
}): Promise<EngineResult> {
  const offer = await prisma.offer.findUnique({
    where: { id: input.offerId },
    include: { items: true, initiator: true, responder: true },
  });
  if (!offer) return { ok: false, error: "Offer not found." };
  if (offer.state !== "PENDING")
    return { ok: false, error: "This offer is no longer open." };
  if (offer.responderId !== input.byUserId)
    return { ok: false, error: "Only the recipient can accept this offer." };

  const offeredIds = offer.items.filter((i) => i.side === "OFFERED").map((i) => i.inventoryCardId);
  const requestedIds = offer.items.filter((i) => i.side === "REQUESTED").map((i) => i.inventoryCardId);
  const offered = await loadCards(offeredIds);
  const requested = await loadCards(requestedIds);

  // Re-validate ownership / availability / pricing at acceptance.
  const offErr = validateBasket(offered, offer.initiatorId, offeredIds, {
    requireListed: false,
  });
  if (offErr) return { ok: false, error: offErr };
  const reqErr = validateBasket(requested, offer.responderId, requestedIds, {
    requireListed: true,
  });
  if (reqErr) return { ok: false, error: reqErr };

  const offeredValue = sum(offered);
  const requestedValue = sum(requested);

  // Volatility lock (Spec §5.5): if either side moved beyond tolerance, refresh
  // the snapshot and require a re-confirm rather than committing silently.
  if (
    volatilityExceeds(offer.offeredValueCents, offeredValue) ||
    volatilityExceeds(offer.requestedValueCents, requestedValue)
  ) {
    await prisma.$transaction([
      prisma.offer.update({
        where: { id: offer.id },
        data: { offeredValueCents: offeredValue, requestedValueCents: requestedValue },
      }),
      ...offered.concat(requested).map((c) =>
        prisma.offerItem.updateMany({
          where: { offerId: offer.id, inventoryCardId: c.id },
          data: { valueCents: c.valueCents ?? 0 },
        }),
      ),
    ]);
    return {
      ok: false,
      needsReconfirm: true,
      error: "Prices moved since this offer was sent — review the updated values and accept again.",
    };
  }

  // Trust-tier ceiling (Spec §6) — both parties must clear it.
  const tradeValue = Math.max(offeredValue, requestedValue);
  const maxCard = Math.max(0, ...offered.concat(requested).map((c) => c.valueCents ?? 0));
  const tier = checkTierCeiling({
    tiers: [offer.initiator.trustTier as TrustTier, offer.responder.trustTier as TrustTier],
    tradeValueCents: tradeValue,
    maxSingleCardValueCents: maxCard,
  });
  if (!tier.ok) return { ok: false, error: tier.reason ?? "Trade exceeds a trust-tier limit." };

  // Overpay gate for the accepting party (responder gives requested, receives offered).
  if (
    overpayExceeds(requestedValue, offeredValue) &&
    !input.overpayAcknowledged
  ) {
    return {
      ok: false,
      needsOverpayConfirm: true,
      error: `You're giving ~$${(requestedValue / 100).toFixed(0)} and receiving ~$${(
        offeredValue / 100
      ).toFixed(0)}. Continue anyway?`,
    };
  }

  const allIds = [...offeredIds, ...requestedIds];
  try {
    await prisma.$transaction(async (tx) => {
      // Guard against a concurrent accept having locked any card.
      const locked = await tx.inventoryCard.count({
        where: { id: { in: allIds }, status: "LOCKED" },
      });
      if (locked > 0) throw new Error("A card was just locked by another trade.");

      await tx.inventoryCard.updateMany({
        where: { id: { in: allIds } },
        data: { status: "LOCKED" },
      });
      await tx.offer.update({
        where: { id: offer.id },
        data: { state: "ACCEPTED" },
      });
      await tx.trade.create({
        data: {
          offerId: offer.id,
          status: "AWAITING_SETTLEMENT",
          offeredValueCents: offeredValue,
          requestedValueCents: requestedValue,
        },
      });
      // Revert other still-pending offers that reference any now-locked card.
      const conflicting = await tx.offerItem.findMany({
        where: { inventoryCardId: { in: allIds }, offer: { state: "PENDING" } },
        select: { offerId: true },
      });
      const conflictIds = [...new Set(conflicting.map((c) => c.offerId))].filter(
        (id) => id !== offer.id,
      );
      if (conflictIds.length > 0) {
        await tx.offer.updateMany({
          where: { id: { in: conflictIds } },
          data: { state: "REJECTED" },
        });
      }
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Acceptance failed." };
  }

  return { ok: true, offerId: offer.id };
}

/** Reject a pending offer (either participant; Spec §5.2). */
export async function rejectOffer(offerId: string, byUserId: string): Promise<EngineResult> {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return { ok: false, error: "Offer not found." };
  if (offer.state !== "PENDING") return { ok: false, error: "This offer is no longer open." };
  if (byUserId !== offer.initiatorId && byUserId !== offer.responderId)
    return { ok: false, error: "Not your offer." };
  await prisma.offer.update({ where: { id: offerId }, data: { state: "REJECTED" } });
  return { ok: true, offerId };
}

/** Withdraw a pending offer (initiator only, before acceptance; Spec §5.2). */
export async function cancelOffer(offerId: string, byUserId: string): Promise<EngineResult> {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return { ok: false, error: "Offer not found." };
  if (offer.state !== "PENDING") return { ok: false, error: "This offer is no longer open." };
  if (byUserId !== offer.initiatorId)
    return { ok: false, error: "Only the sender can withdraw this offer." };
  await prisma.offer.update({ where: { id: offerId }, data: { state: "CANCELLED" } });
  return { ok: true, offerId };
}
