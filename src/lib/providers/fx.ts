/**
 * Currency conversion to AUD cents. The free price sources quote USD
 * (TCGplayer) and EUR (Cardmarket); the product displays AUD (Spec §1.1). These
 * are static placeholder rates for the POC — Stage 5 should replace them with a
 * live FX feed and cache the rate alongside each snapshot.
 */
export const USD_TO_AUD = 1.5;
export const EUR_TO_AUD = 1.65;

/** USD dollars → AUD cents. */
export function usdToAudCents(usd: number): number {
  return Math.round(usd * USD_TO_AUD * 100);
}

/** EUR → AUD cents. */
export function eurToAudCents(eur: number): number {
  return Math.round(eur * EUR_TO_AUD * 100);
}
