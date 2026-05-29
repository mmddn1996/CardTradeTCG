import type { Game } from "@/lib/enums";

/**
 * Seed dataset for the POC. Used by both the seed script and the MockProvider
 * so the app runs fully offline. Real sources replace this in Stage 2.
 * `valueAudNM` is the Near-Mint market price; other bands are derived via the
 * condition multipliers in src/lib/pricing.ts.
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

export const SAMPLE_CARDS: SampleCard[] = [
  // --- Pokémon TCG (Base Set) ---
  {
    externalId: "base1-4",
    game: "POKEMON",
    set: "Base Set",
    number: "4/102",
    name: "Charizard",
    finish: "Holofoil",
    imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    valueAudNM: 420,
  },
  {
    externalId: "base1-2",
    game: "POKEMON",
    set: "Base Set",
    number: "2/102",
    name: "Blastoise",
    finish: "Holofoil",
    imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    valueAudNM: 180,
  },
  {
    externalId: "base1-15",
    game: "POKEMON",
    set: "Base Set",
    number: "15/102",
    name: "Venusaur",
    finish: "Holofoil",
    imageUrl: "https://images.pokemontcg.io/base1/15_hires.png",
    valueAudNM: 140,
  },
  {
    externalId: "base1-58",
    game: "POKEMON",
    set: "Base Set",
    number: "58/102",
    name: "Pikachu",
    finish: "Normal",
    imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
    valueAudNM: 25,
  },
  {
    externalId: "base1-10",
    game: "POKEMON",
    set: "Base Set",
    number: "10/102",
    name: "Mewtwo",
    finish: "Holofoil",
    imageUrl: "https://images.pokemontcg.io/base1/10_hires.png",
    valueAudNM: 55,
  },
  // --- One Piece Card Game (OP01 — Romance Dawn) ---
  {
    externalId: "OP01-001",
    game: "ONE_PIECE",
    set: "OP01 Romance Dawn",
    number: "OP01-001",
    name: "Roronoa Zoro (Leader)",
    finish: "Normal",
    imageUrl:
      "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
    valueAudNM: 30,
  },
  {
    externalId: "OP01-024",
    game: "ONE_PIECE",
    set: "OP01 Romance Dawn",
    number: "OP01-024",
    name: "Monkey.D.Luffy",
    finish: "Normal",
    imageUrl:
      "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-024.png",
    valueAudNM: 18,
  },
  {
    externalId: "OP01-120",
    game: "ONE_PIECE",
    set: "OP01 Romance Dawn",
    number: "OP01-120",
    name: "Monkey.D.Luffy",
    variant: "Alternate Art (Secret Rare)",
    finish: "Foil",
    imageUrl:
      "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png",
    valueAudNM: 260,
  },
];
