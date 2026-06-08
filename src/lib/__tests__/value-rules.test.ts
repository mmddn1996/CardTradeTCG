import { describe, expect, it } from "vitest";
import {
  PRICE_FRESHNESS_MS,
  clampDeclaredValue,
  isStale,
} from "@/lib/value-rules";
import { pricesFromNM, CONDITION_MULTIPLIER, completeBands } from "@/lib/pricing";

describe("isStale (Spec §3.3 stale-price guard)", () => {
  const now = 1_000_000_000_000;
  it("is fresh within the window", () => {
    expect(isStale(new Date(now - 1000), now)).toBe(false);
  });
  it("is stale past the window", () => {
    expect(isStale(new Date(now - PRICE_FRESHNESS_MS - 1), now)).toBe(true);
  });
});

describe("clampDeclaredValue (Spec §3.3 declared-value ceiling)", () => {
  it("returns null when no declared value is given", () => {
    expect(clampDeclaredValue(undefined, 100)).toEqual({
      value: null,
      clamped: false,
    });
  });
  it("keeps a declared value at or below market", () => {
    expect(clampDeclaredValue(80, 100)).toEqual({ value: 80, clamped: false });
  });
  it("clamps a declared value above market down to market", () => {
    expect(clampDeclaredValue(150, 100)).toEqual({
      value: 100,
      clamped: true,
    });
  });
  it("ignores non-positive declarations", () => {
    expect(clampDeclaredValue(0, 100).value).toBeNull();
    expect(clampDeclaredValue(-5, 100).value).toBeNull();
  });
  it("allows any value when the card is unpriced", () => {
    expect(clampDeclaredValue(50, null)).toEqual({ value: 50, clamped: false });
  });
});

describe("completeBands (fill missing bands from a price source)", () => {
  it("keeps explicit per-condition prices and fills the rest from NM", () => {
    const out = completeBands({ NM: 1000, LP: 850 });
    expect(out.NM).toBe(1000);
    expect(out.LP).toBe(850); // explicit value preserved (not 800 from multiplier)
    expect(out.PL).toBe(Math.round(1000 * CONDITION_MULTIPLIER.PL));
    expect(out.PO).toBe(Math.round(1000 * CONDITION_MULTIPLIER.PO));
  });
  it("returns the partial unchanged when there's no NM price", () => {
    expect(completeBands({ LP: 500 })).toEqual({ LP: 500 });
  });
});

describe("pricesFromNM (Spec §3.2 condition bands)", () => {
  it("derives each band from the NM price via its multiplier", () => {
    const p = pricesFromNM(100);
    expect(p.NM).toBe(100);
    expect(p.LP).toBe(100 * CONDITION_MULTIPLIER.LP);
    expect(p.PL).toBe(100 * CONDITION_MULTIPLIER.PL);
    expect(p.PO).toBe(100 * CONDITION_MULTIPLIER.PO);
    expect(p.NM).toBeGreaterThan(p.LP);
    expect(p.LP).toBeGreaterThan(p.PL);
    expect(p.PL).toBeGreaterThan(p.PO);
  });
});
