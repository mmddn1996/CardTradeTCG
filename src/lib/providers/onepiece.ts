import { fetchJson } from "./http";
import type { CatalogCardResult, CatalogProvider, PriceResult } from "./types";

const BASE =
  process.env.ONEPIECE_API_BASE ?? "https://apitcg.com/api/one-piece";

interface OpCard {
  id: string; // e.g. OP01-001
  code?: string;
  name: string;
  set?: { name?: string } | string;
  images?: { large?: string; small?: string };
  image?: string;
}

/**
 * One Piece Card Game provider. Wired against the apitcg.com shape (requires an
 * API key via ONEPIECE_API_KEY). The host must be allowlisted in the
 * environment; otherwise calls fail closed and the caller degrades to the mock
 * / catalog-gap path. No reliable free AUD price feed exists for One Piece yet,
 * so getPrice returns null and such cards stay "unpriced" (Spec §4.6) until a
 * price source is added behind this same interface.
 */
export class OnePieceProvider implements CatalogProvider {
  readonly key = "ONEPIECE_API";
  readonly game = "ONE_PIECE" as const;

  private headers(): Record<string, string> {
    const apiKey = process.env.ONEPIECE_API_KEY;
    return apiKey ? { "x-api-key": apiKey } : {};
  }

  async lookupByCode(code: string): Promise<CatalogCardResult | null> {
    const res = await fetchJson<{ data?: OpCard[] | OpCard }>(
      `${BASE}/cards?id=${encodeURIComponent(code.trim())}`,
      { headers: this.headers() },
    );
    const card = pickFirst(res?.data);
    return card ? toResult(card) : null;
  }

  async search(query: string): Promise<CatalogCardResult[]> {
    const res = await fetchJson<{ data?: OpCard[] }>(
      `${BASE}/cards?name=${encodeURIComponent(query.trim())}&limit=20`,
      { headers: this.headers() },
    );
    const arr = Array.isArray(res?.data) ? res!.data! : [];
    return arr.map(toResult);
  }

  async getPrice(): Promise<PriceResult | null> {
    // apitcg.com serves card data + images but no AUD market price, so One Piece
    // cards stay "unpriced" (Spec §4.6) — they can't be added to an offer until
    // a One Piece price source is plugged in behind this same interface.
    return null;
  }
}

function pickFirst(data: OpCard[] | OpCard | undefined): OpCard | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function toResult(c: OpCard): CatalogCardResult {
  const set = typeof c.set === "string" ? c.set : c.set?.name;
  return {
    externalId: c.id ?? c.code ?? c.name,
    game: "ONE_PIECE",
    set: set ?? "One Piece",
    number: c.id ?? c.code ?? "—",
    name: c.name,
    variant: null,
    finish: null,
    imageUrl: c.images?.large ?? c.images?.small ?? c.image ?? null,
  };
}
