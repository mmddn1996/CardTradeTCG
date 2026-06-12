import type { Game } from "@/lib/enums";

/**
 * Seed dataset for the POC. Used by both the seed script and the MockProvider
 * so the app runs fully offline. `valueAudNM` is the Near-Mint price; other
 * bands derive via the multipliers in src/lib/pricing.ts. Pokémon images use the
 * stable images.pokemontcg.io CDN; One Piece art comes from apitcg in live mode.
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
  description?: string | null;
  rarity?: string | null;
  cardType?: string | null;
  cost?: string | null;
  power?: string | null;
  counter?: string | null;
  valueAudNM: number;
}

interface Extra {
  finish?: string;
  variant?: string | null;
  rarity?: string;
  cardType?: string;
  cost?: string;
  power?: string;
  counter?: string;
}

function poke(num: number, name: string, valueAudNM: number, description: string, e: Extra = {}): SampleCard {
  return {
    externalId: `base1-${num}`,
    game: "POKEMON",
    set: "Base Set",
    number: `${num}/102`,
    name,
    finish: e.finish ?? "Holofoil",
    imageUrl: `https://images.pokemontcg.io/base1/${num}_hires.png`,
    description,
    rarity: e.rarity ?? "Rare Holo",
    cardType: e.cardType ?? null,
    power: e.power ?? null,
    valueAudNM,
  };
}

function op(id: string, set: string, name: string, valueAudNM: number, description: string, e: Extra = {}): SampleCard {
  return {
    externalId: id,
    game: "ONE_PIECE",
    set,
    number: id,
    name,
    variant: e.variant ?? null,
    finish: e.finish ?? null,
    imageUrl: null,
    description,
    rarity: e.rarity ?? "R",
    cardType: e.cardType ?? "Character",
    cost: e.cost ?? null,
    power: e.power ?? null,
    counter: e.counter ?? null,
    valueAudNM,
  };
}

export const SAMPLE_CARDS: SampleCard[] = [
  // --- Pokémon TCG (Base Set) ---
  poke(1, "Alakazam", 45, "Damage Swap: move damage counters between your Pokémon.", { cardType: "Psychic · Stage 2", power: "80 HP" }),
  poke(2, "Blastoise", 180, "Rain Dance: attach extra Water energy. Hydro Pump for 40+.", { cardType: "Water · Stage 2", power: "100 HP" }),
  poke(3, "Chansey", 35, "Scrunch: flip to prevent all damage next turn. Double-edge for 80.", { cardType: "Colorless · Basic", power: "120 HP" }),
  poke(4, "Charizard", 420, "Energy Burn: turn all energy into Fire. Fire Spin for 100 (discard 2 energy).", { cardType: "Fire · Stage 2", power: "120 HP" }),
  poke(5, "Clefairy", 20, "Metronome: copy one of the defending Pokémon's attacks.", { cardType: "Colorless · Basic", power: "40 HP" }),
  poke(6, "Gyarados", 30, "Dragon Rage for 50. Bubblebeam for 40 with a chance to paralyse.", { cardType: "Water · Stage 1", power: "100 HP" }),
  poke(7, "Hitmonchan", 25, "Jab for 20. Special Punch for 40.", { cardType: "Fighting · Basic", power: "70 HP" }),
  poke(8, "Machamp", 18, "Seismic Toss for 60. Resists Psychic.", { cardType: "Fighting · Stage 2", power: "100 HP" }),
  poke(9, "Magneton", 18, "Thunder Wave / Selfdestruct for 80 (hits itself and bench).", { cardType: "Lightning · Stage 1", power: "60 HP" }),
  poke(10, "Mewtwo", 55, "Psychic for 10+ scaling with energy. Barrier prevents damage.", { cardType: "Psychic · Basic", power: "60 HP" }),
  poke(11, "Nidoking", 28, "Thrash for 30 (recoil) / Toxic poisons the defender.", { cardType: "Grass · Stage 2", power: "90 HP" }),
  poke(12, "Ninetales", 32, "Lure pulls a benched Pokémon in. Fire Blast for 80 (discard energy).", { cardType: "Fire · Stage 1", power: "80 HP" }),
  poke(13, "Poliwrath", 22, "Water Gun for 30+. Whirlpool for 40 and discards energy.", { cardType: "Water · Stage 2", power: "90 HP" }),
  poke(14, "Raichu", 40, "Agility / Thunder for 60 (may hit itself).", { cardType: "Lightning · Stage 1", power: "80 HP" }),
  poke(15, "Venusaur", 140, "Energy Trans: move Grass energy freely. Solarbeam for 60.", { cardType: "Grass · Stage 2", power: "100 HP" }),
  poke(16, "Zapdos", 35, "Thunder for 60 (may hit itself). Thunderbolt for 100 (discard all energy).", { cardType: "Lightning · Basic", power: "90 HP" }),
  poke(58, "Pikachu", 25, "Gnaw for 10. Thunder Jolt for 30 (may hit itself).", { cardType: "Lightning · Basic", power: "40 HP", finish: "Normal", rarity: "Common" }),

  // --- One Piece Card Game ---
  op("OP01-001", "OP01 Romance Dawn", "Roronoa Zoro (Leader)", 30,
    "[DON!! x1] [Your Turn] All your Characters gain +1000 power.",
    { cardType: "Leader · Supernovas", rarity: "L", power: "5000", counter: "—" }),
  op("OP01-016", "OP01 Romance Dawn", "Nami", 8,
    "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to a Leader or Character.",
    { cardType: "Character · Straw Hat Crew", rarity: "UC", cost: "1", power: "0", counter: "2000" }),
  op("OP01-024", "OP01 Romance Dawn", "Monkey.D.Luffy", 18,
    "[DON!! x1] [When Attacking] K.O. up to one of your opponent's Characters with a cost of 3 or less.",
    { cardType: "Character · Straw Hat Crew", rarity: "SR", cost: "5", power: "6000", counter: "1000" }),
  op("OP01-120", "OP01 Romance Dawn", "Monkey.D.Luffy", 260,
    "[DON!! x1] [When Attacking] K.O. a Character with cost 3 or less.",
    { cardType: "Character · Straw Hat Crew", rarity: "SEC", cost: "5", power: "6000", counter: "1000", variant: "Alternate Art (Secret Rare)", finish: "Foil" }),
  op("OP02-001", "OP02 Paramount War", "Edward.Newgate (Leader)", 25,
    "[Your Turn] [Once Per Turn] If a DON!! is returned from the field, draw 1 card.",
    { cardType: "Leader · Whitebeard Pirates", rarity: "L", power: "6000", counter: "—" }),
  op("OP05-001", "OP05 Awakening of the New Era", "Sakazuki (Leader)", 22,
    "[Activate: Main] [Once Per Turn] Rest 2 DON!! to draw a card and trash one.",
    { cardType: "Leader · Navy", rarity: "L", power: "5000", counter: "—" }),
  op("OP13-001", "OP13 The Three Brothers", "Monkey.D.Luffy (Leader)", 40,
    "[When Attacking] [Once Per Turn] Give up to 2 rested DON!! to this Leader.",
    { cardType: "Leader · Straw Hat Crew", rarity: "L", power: "5000", counter: "—" }),
  op("OP13-051", "OP13 The Three Brothers", "Portgas.D.Ace", 15,
    "[On Play] Deal 1 damage; [Trigger] Play this card from your trash.",
    { cardType: "Character · Whitebeard Pirates", rarity: "SR", cost: "4", power: "6000", counter: "1000" }),
];
