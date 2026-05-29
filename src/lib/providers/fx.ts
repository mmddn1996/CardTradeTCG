/**
 * Currency conversion to AUD. The free price sources quote USD (TCGplayer) and
 * EUR (Cardmarket); the product displays AUD (Spec §1.1). These are static
 * placeholder rates for the POC — Stage 5 should replace them with a live FX
 * feed and cache the rate alongside each snapshot.
 */
export const USD_TO_AUD = 1.5;
export const EUR_TO_AUD = 1.65;

export function usdToAud(usd: number): number {
  return round2(usd * USD_TO_AUD);
}

export function eurToAud(eur: number): number {
  return round2(eur * EUR_TO_AUD);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
