import "server-only";
import type { ConditionBand, Game } from "@/lib/enums";
import { ConditionBandSchema } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getProvider, type CatalogCardResult } from "@/lib/providers";

/**
 * Resolve a user query to candidate cards. Tries an exact code lookup first
 * (cheap, near-unique — e.g. "base1-4" or "OP01-001"), then falls back to a
 * free-text search returning a ranked shortlist (Spec §4.2 fusion/rank).
 */
export async function lookupCards(
  game: Game,
  query: string,
): Promise<CatalogCardResult[]> {
  const q = query.trim();
  if (!q) return [];
  const provider = getProvider(game);
  const byCode = await provider.lookupByCode(q);
  if (byCode) return [byCode];
  return provider.search(q);
}
import { isStale, type BandPrices } from "@/lib/value-rules";

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
export async function ensurePricing(
  catalogCardId: string,
  externalId: string,
  game: Game,
): Promise<{ prices: BandPrices | null; source: string }> {
  const provider = getProvider(game);

  const latest = await prisma.priceSnapshot.findFirst({
    where: { catalogCardId, source: provider.key },
    orderBy: { capturedAt: "desc" },
  });

  if (latest && !isStale(latest.capturedAt)) {
    return { prices: await readBandPrices(catalogCardId, provider.key), source: provider.key };
  }

  const fresh = await provider.getPrice(externalId);
  if (!fresh) {
    const prices = latest ? await readBandPrices(catalogCardId, provider.key) : null;
    return { prices, source: provider.key };
  }

  const now = new Date();
  for (const band of ConditionBandSchema.options) {
    const valueCents = fresh.byBand[band];
    if (valueCents == null) continue;
    await prisma.priceSnapshot.upsert({
      where: {
        catalogCardId_conditionBand_source: {
          catalogCardId,
          conditionBand: band,
          source: fresh.source,
        },
      },
      update: { valueCents, capturedAt: now },
      create: { catalogCardId, conditionBand: band, valueCents, source: fresh.source },
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
