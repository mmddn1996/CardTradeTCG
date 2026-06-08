import type { ConditionBand } from "@/lib/enums";

/**
 * Money is handled in **integer AUD cents** everywhere (DB, providers, engine)
 * to keep the trade engine's value-delta and threshold maths exact — floating
 * dollars are only ever produced for display via formatAud().
 */

/**
 * Condition-band price multipliers vs Near-Mint (Spec §3.2). Condition
 * materially moves price, so each band maps to its own price point.
 */
export const CONDITION_MULTIPLIER: Record<ConditionBand, number> = {
  NM: 1.0,
  LP: 0.8,
  PL: 0.6,
  PO: 0.35,
};

/** Derive every band's price (cents) from a Near-Mint base price (cents). */
export function pricesFromNM(
  valueNmCents: number,
): Record<ConditionBand, number> {
  return {
    NM: Math.round(valueNmCents * CONDITION_MULTIPLIER.NM),
    LP: Math.round(valueNmCents * CONDITION_MULTIPLIER.LP),
    PL: Math.round(valueNmCents * CONDITION_MULTIPLIER.PL),
    PO: Math.round(valueNmCents * CONDITION_MULTIPLIER.PO),
  };
}

/**
 * Fill any missing condition band from the Near-Mint price via the multipliers,
 * keeping whatever explicit per-band prices a source already provided. If there
 * is no NM price, the partial map is returned unchanged.
 */
export function completeBands(
  partial: Partial<Record<ConditionBand, number>>,
): Partial<Record<ConditionBand, number>> {
  if (partial.NM == null) return partial;
  const base = pricesFromNM(partial.NM);
  const out: Record<ConditionBand, number> = { ...base };
  for (const band of Object.keys(partial) as ConditionBand[]) {
    const v = partial[band];
    if (v != null) out[band] = v;
  }
  return out;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Format integer AUD cents as a currency string. */
export function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
