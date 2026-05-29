import { z } from "zod";

/**
 * Controlled vocabularies. SQLite has no native enums, so these are the single
 * source of truth for the string values stored in the DB. Moving to Postgres
 * later can promote these to native enums without touching application code.
 */

export const Game = {
  POKEMON: "POKEMON",
  ONE_PIECE: "ONE_PIECE",
} as const;
export const GameSchema = z.enum(["POKEMON", "ONE_PIECE"]);
export type Game = z.infer<typeof GameSchema>;

export const GAME_LABEL: Record<Game, string> = {
  POKEMON: "Pokémon TCG",
  ONE_PIECE: "One Piece Card Game",
};

/** Condition bands (Spec §3.2). Each maps to its own price point. */
export const ConditionBandSchema = z.enum(["NM", "LP", "PL", "PO"]);
export type ConditionBand = z.infer<typeof ConditionBandSchema>;

export const CONDITION_LABEL: Record<ConditionBand, string> = {
  NM: "Mint / Near-Mint",
  LP: "Lightly Played",
  PL: "Played",
  PO: "Poor",
};

/** Trust tiers (Spec §6). Limits enforced at offer acceptance in Stage 3+. */
export const TrustTierSchema = z.enum(["BASIC", "L1", "L2", "L3", "X1"]);
export type TrustTier = z.infer<typeof TrustTierSchema>;

/** Inventory lifecycle (Spec §2.3 / §5.6). */
export const InventoryStatusSchema = z.enum(["VAULT", "LISTED", "LOCKED"]);
export type InventoryStatus = z.infer<typeof InventoryStatusSchema>;

export const ListingTypeSchema = z.enum(["HAVE", "WANT"]);
export type ListingType = z.infer<typeof ListingTypeSchema>;
