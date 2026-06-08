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
  description?: string | null;
  valueAudNM: number;
}

function poke(
  num: number,
  name: string,
  valueAudNM: number,
  description?: string,
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
    description: description ?? null,
    valueAudNM,
  };
}

function op(
  id: string,
  set: string,
  name: string,
  valueAudNM: number,
  description?: string,
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
    description: description ?? null,
    valueAudNM,
  };
}

export const SAMPLE_CARDS: SampleCard[] = [
  // --- Pokémon TCG (Base Set) — stable CDN images ---
  poke(1, "Alakazam", 45, "Damage Swap: move damage counters between your Pokémon."),
  poke(2, "Blastoise", 180, "Rain Dance: attach extra Water energy. Hydro Pump hits for 40+."),
  poke(3, "Chansey", 35, "Scrunch: flip to prevent all damage next turn. Double-edge for 80."),
  poke(4, "Charizard", 420, "Energy Burn: turn all energy into Fire. Fire Spin for 100 (discard 2 energy)."),
  poke(5, "Clefairy", 20, "Metronome: copy one of the defending Pokémon's attacks."),
  poke(6, "Gyarados", 30, "Dragon Rage for 50. Bubblebeam for 40 with a chance to paralyse."),
  poke(7, "Hitmonchan", 25, "Jab for 20. Special Punch for 40."),
  poke(8, "Machamp", 18, "Seismic Toss for 60. Resists Psychic."),
  poke(9, "Magneton", 18, "Thunder Wave / Selfdestruct for 80 (hits itself and bench)."),
  poke(10, "Mewtwo", 55, "Psychic for 10+ scaling with energy. Barrier discards Psychic to prevent damage."),
  poke(11, "Nidoking", 28, "Thrash for 30 (recoil) / Toxic poisons the defender."),
  poke(12, "Ninetales", 32, "Lure pulls a benched Pokémon in. Fire Blast for 80 (discard energy)."),
  poke(13, "Poliwrath", 22, "Water Gun for 30+. Whirlpool for 40 and discards energy."),
  poke(14, "Raichu", 40, "Agility / Thunder for 60 (may hit itself)."),
  poke(15, "Venusaur", 140, "Energy Trans: move Grass energy freely. Solarbeam for 60."),
  poke(16, "Zapdos", 35, "Thunder for 60 (may hit itself). Thunderbolt for 100 (discard all energy)."),
  poke(58, "Pikachu", 25, "Gnaw for 10. Thunder Jolt for 30 (may hit itself).", "Normal"),

  // --- One Piece Card Game (spread across sets, incl. OP13) ---
  op("OP01-001", "OP01 Romance Dawn", "Roronoa Zoro (Leader)", 30,
    "Leader. [DON!! x1] [Your Turn] All your Characters gain +1000 power."),
  op("OP01-016", "OP01 Romance Dawn", "Nami", 8,
    "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to a Leader or Character."),
  op("OP01-024", "OP01 Romance Dawn", "Monkey.D.Luffy", 18,
    "[DON!! x1] [When Attacking] K.O. up to one of your opponent's Characters with a cost of 3 or less."),
  op("OP01-120", "OP01 Romance Dawn", "Monkey.D.Luffy", 260,
    "[DON!! x1] [When Attacking] K.O. a Character with cost 3 or less.",
    "Alternate Art (Secret Rare)", "Foil"),
  op("OP02-001", "OP02 Paramount War", "Edward.Newgate (Leader)", 25,
    "Leader. [Your Turn] [Once Per Turn] If a DON!! is returned from the field, draw 1 card."),
  op("OP05-001", "OP05 Awakening of the New Era", "Sakazuki (Leader)", 22,
    "Leader. [Activate: Main] [Once Per Turn] You may rest 2 DON!! to draw a card and trash one."),
  op("OP13-001", "OP13 The Three Brothers", "Monkey.D.Luffy (Leader)", 40,
    "Leader. [When Attacking] [Once Per Turn] Give up to 2 rested DON!! to this Leader."),
  op("OP13-051", "OP13 The Three Brothers", "Portgas.D.Ace", 15,
    "[On Play] Deal 1 damage; [Trigger] Play this card from your trash."),
];
