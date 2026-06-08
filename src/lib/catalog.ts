import "server-only";
import type { ConditionBand, Game } from "@/lib/enums";
import { ConditionBandSchema } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import {
  getCatalogProvider,
  getPricingProvider,
  type CatalogCardResult,
} from "@/lib/providers";
import { isStale, type BandPrices } from "@/lib/value-rules";

// A single-card code, e.g. base1-4, OP13-001, sv3pt5-25, 4/102.
const CARD_CODE = /^[a-z0-9]+(?:pt[0-9]+)?[-/]\d+[a-z]?$/i;
// A set/expansion code, e.g. OP12, base1, sv3, swsh10.
const SET_CODE = /^[a-z]{2,6}\d{1,3}[a-z]*$/i;

/**
 * Resolve a user query to candidate cards, routing on the query shape so each
 * lookup is a single request (fast):
 *  - a card code  → exact lookup of one card;
 *  - a set code   → every card in the set (Spec §4.4 set ingestion);
 *  - anything else → free-text name search (Spec §4.2 ranked shortlist).
 */
export async function lookupCards(
  game: Game,
  query: string,
): Promise<CatalogCardResult[]> {
  const q = query.trim();
  if (!q) return [];
  const provider = getCatalogProvider(game);

  if (CARD_CODE.test(q)) {
    const hit = await provider.lookupByCode(q);
    if (hit) return [hit];
    // Not an exact code after all — fall back to a search.
    return provider.search(q);
  }
  if (SET_CODE.test(q)) {
    const set = await provider.lookupBySet(q);
    if (set.length > 0) return set;
    return provider.search(q);
  }
  return provider.search(q);
}

/**
 * Find-or-create a CatalogCard from a provider result, keyed by externalId.
 * (Prisma disallows null in compound-unique lookups, so we match on the stable
 * provider id rather than the natural key.)
 */
export async function findOrCreateCatalogCard(result: CatalogCardResult) {
  const existing = await prisma.catalogCard.findFirst({
    where: { externalId: result.externalId },
  });
  if (existing) return existing;

  return prisma.catalogCard.create({
    data: {
      externalId: result.externalId,
      game: result.game,
      set: result.set,
      number: result.number,
      name: result.name,
      variant: result.variant ?? null,
      finish: result.finish ?? null,
      imageUrl: result.imageUrl ?? null,
    },
  });
}

async function readBandPrices(
  catalogCardId: string,
  source: string,
): Promise<BandPrices> {
  const snaps = await prisma.priceSnapshot.findMany({
    where: { catalogCardId, source },
    orderBy: { capturedAt: "desc" },
  });
  const out: BandPrices = {};
  for (const s of snaps) {
    const band = s.conditionBand as ConditionBand;
    if (out[band] == null) out[band] = s.valueCents;
  }
  return out;
}

/**
 * Ensure the card has fresh pricing (Spec §3.3 stale-price guard) and return
 * its per-band AUD values. Re-fetches from the provider when the latest
 * snapshot is missing or older than the freshness window; on a provider/network
 * failure it keeps and returns the prior (stale) snapshot, or null if there's
 * none — an unpriced card (Spec §4.6).
 */
export async function ensurePricing(card: {
  id: string;
  externalId: string | null;
  game: string;
  number: string;
  name: string;
  set: string;
  finish: string | null;
}): Promise<{ prices: BandPrices | null; source: string }> {
  const provider = getPricingProvider(card.game as Game);

  const latest = await prisma.priceSnapshot.findFirst({
    where: { catalogCardId: card.id, source: provider.key },
    orderBy: { capturedAt: "desc" },
  });

  if (latest && !isStale(latest.capturedAt)) {
    return {
      prices: await readBandPrices(card.id, provider.key),
      source: provider.key,
    };
  }

  const fresh = await provider.getPrice({
    game: card.game as Game,
    externalId: card.externalId ?? "",
    number: card.number,
    name: card.name,
    set: card.set,
    finish: card.finish,
  });
  if (!fresh) {
    const prices = latest ? await readBandPrices(card.id, provider.key) : null;
    return { prices, source: provider.key };
  }

  const now = new Date();
  for (const band of ConditionBandSchema.options) {
    const valueCents = fresh.byBand[band];
    if (valueCents == null) continue;
    await prisma.priceSnapshot.upsert({
      where: {
        catalogCardId_conditionBand_source: {
          catalogCardId: card.id,
          conditionBand: band,
          source: fresh.source,
        },
      },
      update: { valueCents, capturedAt: now },
      create: {
        catalogCardId: card.id,
        conditionBand: band,
        valueCents,
        source: fresh.source,
      },
    });
  }
  return { prices: fresh.byBand, source: fresh.source };
}

export async function recordCatalogGap(input: {
  game: Game;
  query: string;
  kind?: "CODE" | "SEARCH" | "MANUAL";
  reportedById?: string | null;
  note?: string;
}) {
  return prisma.catalogGap.create({
    data: {
      game: input.game,
      query: input.query,
      kind: input.kind ?? "CODE",
      reportedById: input.reportedById ?? null,
      note: input.note ?? null,
    },
  });
}
