import type { ConditionBand } from "@/lib/enums";

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

/** Derive every band's AUD price from a Near-Mint base price. */
export function pricesFromNM(
  valueAudNM: number,
): Record<ConditionBand, number> {
  return {
    NM: round2(valueAudNM * CONDITION_MULTIPLIER.NM),
    LP: round2(valueAudNM * CONDITION_MULTIPLIER.LP),
    PL: round2(valueAudNM * CONDITION_MULTIPLIER.PL),
    PO: round2(valueAudNM * CONDITION_MULTIPLIER.PO),
  };
}

export function formatAud(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
