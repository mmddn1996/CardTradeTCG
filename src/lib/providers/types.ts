import type { ConditionBand, Game } from "@/lib/enums";

/**
 * Provider interfaces (Spec §2.2 / §4.5). Identity and pricing are deliberately
 * *separate* services: no single free source gives card identity, art, and
 * price for every game. A CatalogProvider resolves identity + art (per game:
 * Pokémon TCG API, apitcg for One Piece); a PricingProvider resolves price
 * (JustTCG covers both games). Callers compose the two and never branch on the
 * concrete source.
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
  /** Rules / ability / effect text (Spec §4.4 catalog data). */
  description?: string | null;
  /** Gameplay metadata (varies by game). */
  rarity?: string | null;
  cardType?: string | null;
  cost?: string | null;
  power?: string | null;
  counter?: string | null;
}

/** A set/expansion the user can browse (Spec §4.4). */
export interface SetInfo {
  code: string; // stable id used by lookupBySet, e.g. "base1", "OP13"
  name: string; // display name, e.g. "Base Set", "OP13 The Three Brothers"
  game: Game;
}

export interface CatalogProvider {
  readonly key: string;
  readonly game: Game;

  /** Resolve a single card by its in-game code (e.g. base1-4, OP13-001). */
  lookupByCode(code: string): Promise<CatalogCardResult | null>;

  /** Free-text search returning a ranked shortlist. */
  search(query: string): Promise<CatalogCardResult[]>;

  /** Return every card in a set/expansion (e.g. "OP12", "base1"). */
  lookupBySet(setCode: string): Promise<CatalogCardResult[]>;

  /** List the browsable sets for this game (most recent first). */
  listSets(): Promise<SetInfo[]>;
}

/** Identity needed to price a card across sources. */
export interface PriceRef {
  game: Game;
  externalId: string;
  number: string;
  name: string;
  set: string;
  finish?: string | null;
}

export interface PriceResult {
  /** Price per condition band, in **AUD cents**. */
  byBand: Partial<Record<ConditionBand, number>>;
  source: string;
  capturedAt: Date;
}

export interface PricingProvider {
  /** Stable key recorded on PriceSnapshot.source. */
  readonly key: string;
  /** Current market price for a known card, or null if unpriced. */
  getPrice(ref: PriceRef): Promise<PriceResult | null>;
}
