import type { Game } from "@/lib/enums";
import { dollarsToCents, pricesFromNM } from "@/lib/pricing";
import { SAMPLE_CARDS, type SampleCard } from "./sample-data";
import type {
  CatalogCardResult,
  CatalogProvider,
  PriceRef,
  PriceResult,
  PricingProvider,
  SetInfo,
} from "./types";

/** Derive a set code from a sample card's id ("base1-4"→"base1", "OP13-001"→"OP13"). */
function setCodeOf(externalId: string): string {
  return externalId.split("-")[0];
}

/**
 * Offline provider backed by the seeded sample dataset. Implements *both* the
 * catalog and pricing interfaces so the whole app runs without network access
 * (CARDSWAP_PROVIDERS=mock). Live mode swaps in the real per-game providers.
 */
export class MockProvider implements CatalogProvider, PricingProvider {
  readonly key = "MOCK";
  readonly game: Game;
  private cards: SampleCard[];

  constructor(game: Game) {
    this.game = game;
    this.cards = SAMPLE_CARDS.filter((c) => c.game === game);
  }

  async lookupByCode(code: string): Promise<CatalogCardResult | null> {
    const norm = code.trim().toLowerCase();
    const hit = this.cards.find(
      (c) =>
        c.number.toLowerCase() === norm || c.externalId.toLowerCase() === norm,
    );
    return hit ? toResult(hit) : null;
  }

  async search(query: string): Promise<CatalogCardResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.cards.map(toResult);
    return this.cards
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.number.toLowerCase().includes(q) ||
          c.externalId.toLowerCase().includes(q),
      )
      .map(toResult);
  }

  async lookupBySet(setCode: string): Promise<CatalogCardResult[]> {
    const s = setCode.trim().toLowerCase();
    return this.cards
      .filter(
        (c) =>
          c.externalId.toLowerCase().startsWith(`${s}-`) ||
          c.set.toLowerCase().includes(s),
      )
      .map(toResult);
  }

  async listSets(): Promise<SetInfo[]> {
    const seen = new Map<string, SetInfo>();
    for (const c of this.cards) {
      const code = setCodeOf(c.externalId);
      if (!seen.has(code)) seen.set(code, { code, name: c.set, game: this.game });
    }
    return [...seen.values()];
  }

  async getPrice(ref: PriceRef): Promise<PriceResult | null> {
    const card = this.cards.find((c) => c.externalId === ref.externalId);
    if (!card) return null;
    return {
      byBand: pricesFromNM(dollarsToCents(card.valueAudNM)),
      source: this.key,
      capturedAt: new Date(),
    };
  }
}

function toResult(c: SampleCard): CatalogCardResult {
  return {
    externalId: c.externalId,
    game: c.game,
    set: c.set,
    number: c.number,
    name: c.name,
    variant: c.variant ?? null,
    finish: c.finish ?? null,
    imageUrl: c.imageUrl ?? null,
    description: c.description ?? null,
    rarity: c.rarity ?? null,
    cardType: c.cardType ?? null,
    cost: c.cost ?? null,
    power: c.power ?? null,
    counter: c.counter ?? null,
  };
}
