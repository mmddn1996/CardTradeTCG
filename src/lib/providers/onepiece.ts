import { fetchJson } from "./http";
import type { CatalogCardResult, CatalogProvider } from "./types";

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
 * One Piece catalog provider (apitcg.com) — identity + art. Requires an API key
 * (ONEPIECE_API_KEY). Pricing is handled separately by the JustTCG pricing
 * provider (apitcg has no prices). apitcg matches string params as substrings,
 * which we use: exact `id` for a single card, substring `code` for a whole set,
 * substring `name` for free-text search.
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
    return (Array.isArray(res?.data) ? res!.data! : []).map(toResult);
  }

  async lookupBySet(setCode: string): Promise<CatalogCardResult[]> {
    // apitcg substring-matches `code`, so the set prefix returns the whole set.
    const res = await fetchJson<{ data?: OpCard[] }>(
      `${BASE}/cards?code=${encodeURIComponent(setCode.trim())}&limit=300`,
      { headers: this.headers() },
    );
    return (Array.isArray(res?.data) ? res!.data! : []).map(toResult);
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
