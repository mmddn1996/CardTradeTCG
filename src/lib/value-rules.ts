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
