import type { ConditionBand, Game } from "@/lib/enums";

/**
 * Pluggable catalog + pricing provider interface (Spec §4.5).
 *
 * Every external lookup of card identity or price goes through this interface.
 * Stage 1 ships `MockProvider` (seeded local data, works offline). Stage 2 adds
 * real providers (Pokémon TCG API, a One Piece source) behind the same shape —
 * callers never change. Pricing is "pluggable behind the Pricing service
 * interface so a second source can be added without touching callers."
 */

export interface CatalogCardResult {
  externalId: string;
  game: Game;
  set: string;
  number: string;
  name: string;
  variant?: string | null;
  finish?: string | null;
  imageUrl?: string | null;
}

export interface PriceResult {
  /** Price per condition band, in AUD. */
  byBand: Partial<Record<ConditionBand, number>>;
  source: string;
  capturedAt: Date;
}

export interface CatalogProvider {
  /** Stable key recorded on PriceSnapshot.source. */
  readonly key: string;
  /** Which game this provider serves. */
  readonly game: Game;

  /** Look up a card by its in-game code (Stage 2). */
  lookupByCode(code: string): Promise<CatalogCardResult | null>;

  /** Free-text search returning a ranked shortlist (Stage 2). */
  search(query: string): Promise<CatalogCardResult[]>;

  /** Current market price for a known card. */
  getPrice(externalId: string): Promise<PriceResult | null>;
}
