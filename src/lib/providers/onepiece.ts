import { fetchJson } from "./http";
import type { CatalogCardResult, CatalogProvider, SetInfo } from "./types";

// Use www. directly — the bare host redirects, which can drop the x-api-key
// header on the hop.
const BASE =
  process.env.ONEPIECE_API_BASE ?? "https://www.apitcg.com/api/one-piece";

interface OpCard {
  id: string; // e.g. OP01-001
  code?: string;
  name: string;
  set?: { name?: string } | string;
  images?: { large?: string; small?: string };
  image?: string;
  ability?: string;
  trigger?: string;
  effect?: string;
  type?: string;
  rarity?: string;
  cost?: string | number;
  power?: string | number;
  counter?: string | number;
  family?: string;
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
    const q = code.trim();
    // Try the exact id first, then the card code, before giving up.
    for (const param of ["id", "code"]) {
      const res = await fetchJson<{ data?: OpCard[] | OpCard }>(
        `${BASE}/cards?${param}=${encodeURIComponent(q)}`,
        { headers: this.headers() },
      );
      const card = pickFirst(res?.data);
      if (card) return toResult(card);
    }
    return null;
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

  async listSets(): Promise<SetInfo[]> {
    const res = await fetchJson<{ data?: { id?: string; code?: string; name?: string }[] }>(
      `${BASE}/sets`,
      { headers: this.headers() },
    );
    const arr = Array.isArray(res?.data) ? res!.data! : [];
    return arr
      .map((s) => ({ code: s.code ?? s.id ?? "", name: s.name ?? s.code ?? s.id ?? "", game: "ONE_PIECE" as const }))
      .filter((s) => s.code);
  }
}

function pickFirst(data: OpCard[] | OpCard | undefined): OpCard | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function toResult(c: OpCard): CatalogCardResult {
  const set = typeof c.set === "string" ? c.set : c.set?.name;
  const desc = [c.ability, c.effect, c.trigger && `[Trigger] ${c.trigger}`]
    .filter(Boolean)
    .join("\n");
  return {
    externalId: c.id ?? c.code ?? c.name,
    game: "ONE_PIECE",
    set: set ?? "One Piece",
    number: c.id ?? c.code ?? "—",
    name: c.name,
    variant: null,
    finish: null,
    imageUrl: c.images?.large ?? c.images?.small ?? c.image ?? null,
    description: desc || null,
    rarity: c.rarity ?? null,
    cardType: [c.type, c.family].filter(Boolean).join(" · ") || null,
    cost: c.cost != null ? String(c.cost) : null,
    power: c.power != null ? String(c.power) : null,
    counter: c.counter != null ? String(c.counter) : null,
  };
}
