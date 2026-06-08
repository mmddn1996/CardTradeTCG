import type { ConditionBand } from "@/lib/enums";

/**
 * Price freshness window (Spec §3.3 stale-price guard). Snapshots older than
 * this are re-fetched before they're trusted (e.g. before an offer can be
 * accepted in Stage 3).
 */
export const PRICE_FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24h

export function isStale(
  capturedAt: Date,
  now: number = Date.now(),
  windowMs: number = PRICE_FRESHNESS_MS,
): boolean {
  return now - new Date(capturedAt).getTime() > windowMs;
}

export interface DeclaredValueResult {
  /** Stored declared value, or null when none applies. */
  value: number | null;
  /** True when the user's declared value was clamped down to market. */
  clamped: boolean;
}

/**
 * Declared-value ceiling (Spec §3.3): users cannot manually inflate a card
 * above its market snapshot. A declared value above market is clamped to
 * market; non-positive or absent declarations store null (use market value).
 */
export function clampDeclaredValue(
  declared: number | null | undefined,
  marketValue: number | null,
): DeclaredValueResult {
  if (declared == null || Number.isNaN(declared) || declared <= 0) {
    return { value: null, clamped: false };
  }
  if (marketValue != null && declared > marketValue) {
    return { value: marketValue, clamped: true };
  }
  return { value: declared, clamped: false };
}

/** Map of every condition band to a value, given a per-band price lookup. */
export type BandPrices = Partial<Record<ConditionBand, number>>;

/** Overpay speed-bump threshold (Spec §5.5): the disadvantaged side must
 * confirm when giving > 15% more value than they receive. */
export const OVERPAY_THRESHOLD = 0.15;

/** Re-price volatility tolerance at acceptance (Spec §3.3 / §5.5): if either
 * basket moves beyond ±5% the offer reverts to pending for re-confirmation. */
export const VOLATILITY_TOLERANCE = 0.05;

/** Value gained by a party: what they receive minus what they give (cents).
 * Positive = favourable to that party. */
export function valueDelta(receiveCents: number, giveCents: number): number {
  return receiveCents - giveCents;
}

/**
 * True when a party gives more than `threshold` above what they receive — the
 * only case that triggers the overpay confirmation (Spec §5.5). Never blocks;
 * the disadvantaged side just has to acknowledge it.
 */
export function overpayExceeds(
  giveCents: number,
  receiveCents: number,
  threshold: number = OVERPAY_THRESHOLD,
): boolean {
  if (giveCents <= 0) return false;
  if (receiveCents <= 0) return true;
  return giveCents > receiveCents * (1 + threshold);
}

/** True when a re-priced total has moved beyond tolerance vs its baseline. */
export function volatilityExceeds(
  baselineCents: number,
  currentCents: number,
  tolerance: number = VOLATILITY_TOLERANCE,
): boolean {
  if (baselineCents <= 0) return currentCents > 0;
  return Math.abs(currentCents - baselineCents) > baselineCents * tolerance;
}
