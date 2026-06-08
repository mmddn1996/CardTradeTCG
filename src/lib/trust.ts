import type { TrustTier } from "@/lib/enums";

/**
 * Trust-tier ceilings (Spec §6) — the *only* value-based restriction in the
 * system. Limits are enforced at offer acceptance against both the per-card
 * value and the total trade value. Within a tier, baskets need not be balanced
 * (Spec §5.4). Values in AUD cents; null = uncapped.
 */
export interface TierLimit {
  maxCardValueCents: number | null;
  maxTradeValueCents: number | null;
}

export const TIER_LIMITS: Record<TrustTier, TierLimit> = {
  BASIC: { maxCardValueCents: 1_500, maxTradeValueCents: 3_000 },
  L1: { maxCardValueCents: 3_000, maxTradeValueCents: 5_000 },
  L2: { maxCardValueCents: 5_000, maxTradeValueCents: 15_000 },
  L3: { maxCardValueCents: 15_000, maxTradeValueCents: 30_000 },
  X1: { maxCardValueCents: null, maxTradeValueCents: null },
};

export interface TierCheck {
  ok: boolean;
  /** Tier that fails, if any (the more restrictive of the two parties). */
  limitingTier?: TrustTier;
  reason?: string;
}

function withinTier(
  tier: TrustTier,
  tradeValueCents: number,
  maxSingleCardValueCents: number,
): boolean {
  const lim = TIER_LIMITS[tier];
  const cardOk =
    lim.maxCardValueCents == null ||
    maxSingleCardValueCents <= lim.maxCardValueCents;
  const tradeOk =
    lim.maxTradeValueCents == null ||
    tradeValueCents <= lim.maxTradeValueCents;
  return cardOk && tradeOk;
}

/**
 * Both parties must clear the tier for the trade (Spec §6). `tradeValueCents`
 * is the larger basket total; `maxSingleCardValueCents` is the most valuable
 * single card across both baskets. Returns the limiting tier when blocked.
 */
export function checkTierCeiling(input: {
  tiers: TrustTier[];
  tradeValueCents: number;
  maxSingleCardValueCents: number;
}): TierCheck {
  for (const tier of input.tiers) {
    if (!withinTier(tier, input.tradeValueCents, input.maxSingleCardValueCents)) {
      return {
        ok: false,
        limitingTier: tier,
        reason: `Trade exceeds the ${tier} tier ceiling (max card ${fmt(
          TIER_LIMITS[tier].maxCardValueCents,
        )}, max trade ${fmt(TIER_LIMITS[tier].maxTradeValueCents)}).`,
      };
    }
  }
  return { ok: true };
}

function fmt(cents: number | null): string {
  return cents == null ? "uncapped" : `$${(cents / 100).toFixed(0)}`;
}
