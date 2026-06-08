import type { Game } from "@/lib/enums";

/**
 * Seed dataset for the POC. Used by both the seed script and the MockProvider
 * so the app runs fully offline (CARDSWAP_PROVIDERS=mock). Real sources replace
 * this in live mode. `valueAudNM` is the Near-Mint market price; other bands are
 * derived via the condition multipliers in src/lib/pricing.ts.
 *
 * Pokémon images use the stable images.pokemontcg.io CDN (loads in a browser).
 * One Piece images are left null here so the UI shows the clean placeholder —
 * real One Piece artwork comes from the apitcg.com provider in live mode.
 */
export interface SampleCard {
  externalId: string;
  game: Game;
  set: string;
  number: string;
  name: string;
  variant?: string | null;
  finish?: string | null;
  imageUrl?: string | null;
  valueAudNM: number;
}

function poke(
  num: number,
  name: string,
  valueAudNM: number,
  finish = "Holofoil",
): SampleCard {
  return {
    externalId: `base1-${num}`,
    game: "POKEMON",
    set: "Base Set",
    number: `${num}/102`,
    name,
    finish,
    imageUrl: `https://images.pokemontcg.io/base1/${num}_hires.png`,
    valueAudNM,
  };
}

function op(
  id: string,
  set: string,
  name: string,
  valueAudNM: number,
  variant: string | null = null,
  finish: string | null = null,
): SampleCard {
  return {
    externalId: id,
    game: "ONE_PIECE",
    set,
    number: id,
    name,
    variant,
    finish,
    imageUrl: null, // real art via apitcg.com in live mode
    valueAudNM,
  };
}

export const SAMPLE_CARDS: SampleCard[] = [
  // --- Pokémon TCG (Base Set) — stable CDN images ---
  poke(1, "Alakazam", 45),
  poke(2, "Blastoise", 180),
  poke(3, "Chansey", 35),
  poke(4, "Charizard", 420),
  poke(5, "Clefairy", 20),
  poke(6, "Gyarados", 30),
  poke(7, "Hitmonchan", 25),
  poke(8, "Machamp", 18),
  poke(9, "Magneton", 18),
  poke(10, "Mewtwo", 55),
  poke(11, "Nidoking", 28),
  poke(12, "Ninetales", 32),
  poke(13, "Poliwrath", 22),
  poke(14, "Raichu", 40),
  poke(15, "Venusaur", 140),
  poke(16, "Zapdos", 35),
  poke(58, "Pikachu", 25, "Normal"),

  // --- One Piece Card Game (spread across sets, incl. OP13) ---
  op("OP01-001", "OP01 Romance Dawn", "Roronoa Zoro (Leader)", 30),
  op("OP01-016", "OP01 Romance Dawn", "Nami", 8),
  op("OP01-024", "OP01 Romance Dawn", "Monkey.D.Luffy", 18),
  op(
    "OP01-120",
    "OP01 Romance Dawn",
    "Monkey.D.Luffy",
    260,
    "Alternate Art (Secret Rare)",
    "Foil",
  ),
  op("OP02-001", "OP02 Paramount War", "Edward.Newgate (Leader)", 25),
  op("OP05-001", "OP05 Awakening of the New Era", "Sakazuki (Leader)", 22),
  op("OP13-001", "OP13 The Three Brothers", "Monkey.D.Luffy (Leader)", 40),
  op("OP13-051", "OP13 The Three Brothers", "Portgas.D.Ace", 15),
];
