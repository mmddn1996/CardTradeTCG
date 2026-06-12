import { fetchJson } from "./http";
import type { CatalogCardResult, CatalogProvider, SetInfo } from "./types";

// Use www. directly — the bare host redirects, which can drop the x-api-key
// header on the hop.
const BASE =
  process.env.ONEPIECE_API_BASE ?? "https://www.apitcg.com/api/one-piece";

// apitcg shapes (verified against live responses):
// - every /cards call is paginated: { page, limit, total, data: [...] }
// - `id` is NOT unique: alt-arts share `code` but get an `_pN` suffix on `id`
// - `ability` holds the rules text; `trigger` is often ""; there is no `effect`
// - `counter` is a string ("-" when none); `cost`/`power` are numbers
// - images are hosted on en.onepiece-cardgame.com (proxied for hotlinking)
// - `set` is { name } only — there is no set-code field on a card
interface OpCard {
  id: string;
  code?: string;
  name: string;
  set?: { name?: string } | string;
  images?: { large?: string; small?: string };
  image?: string;
  ability?: string;
  trigger?: string;
  type?: string;
  rarity?: string;
  cost?: string | number;
  power?: string | number;
  counter?: string | number;
  color?: string;
  family?: string;
}

interface OpListResponse {
  data?: OpCard[];
}

/**
 * One Piece catalog provider (apitcg.com) — identity + art. Requires an API key
 * (ONEPIECE_API_KEY). Pricing is handled separately by JustTCG (apitcg has no
 * prices). Set browsing is best-effort: apitcg has no card→set-code link, so we
 * try a `set`/`code` filter and keep only cards whose set name carries the code.
 */
export class OnePieceProvider implements CatalogProvider {
  readonly key = "ONEPIECE_API";
  readonly game = "ONE_PIECE" as const;

  private headers(): Record<string, string> {
    const apiKey = process.env.ONEPIECE_API_KEY;
    return apiKey ? { "x-api-key": apiKey } : {};
  }

  private async fetchCards(qs: string): Promise<OpCard[]> {
    const res = await fetchJson<OpListResponse>(`${BASE}/cards?${qs}`, {
      headers: this.headers(),
    });
    return Array.isArray(res?.data) ? res!.data! : [];
  }

  async lookupByCode(code: string): Promise<CatalogCardResult | null> {
    const q = code.trim();
    for (const param of ["id", "code"]) {
      const cards = await this.fetchCards(`${param}=${encodeURIComponent(q)}`);
      if (cards.length === 0) continue;
      // Prefer the base printing (exact id, no _pN alt-art suffix).
      const base =
        cards.find((c) => c.id === q) ??
        cards.find((c) => c.code === q && !c.id?.includes("_")) ??
        cards[0];
      return toResult(base);
    }
    return null;
  }

  async search(query: string): Promise<CatalogCardResult[]> {
    const cards = await this.fetchCards(
      `name=${encodeURIComponent(query.trim())}&limit=30`,
    );
    return cards.map(toResult);
  }

  async lookupBySet(setCode: string): Promise<CatalogCardResult[]> {
    // apitcg has no card→set-code join (verified: both ?code= and ?set= return
    // 0), and paginating the whole DB to match set.name is too expensive at
    // request time. Set browsing is therefore unsupported for live One Piece —
    // see listSets(). Search by name/code instead.
    void setCode;
    return [];
  }

  async listSets(): Promise<SetInfo[]> {
    // Disabled for live One Piece (see lookupBySet). Returning [] makes the Add
    // screen show "set browsing isn't available" rather than a dead-end list.
    return [];
  }
}

function setName(c: OpCard): string {
  return (typeof c.set === "string" ? c.set : c.set?.name) ?? "";
}

function titleCase(t?: string): string | null {
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function toResult(c: OpCard): CatalogCardResult {
  // Alt-arts (id "OP01-001_p1") share the printed code; keep them distinct via
  // a variant so the natural-key unique constraint doesn't collide.
  const suffix = c.id?.includes("_") ? c.id.slice(c.id.indexOf("_") + 1) : null;
  const desc = [c.ability, c.trigger ? `[Trigger] ${c.trigger}` : null]
    .filter(Boolean)
    .join("\n");
  const counter =
    c.counter != null && String(c.counter) !== "-" ? String(c.counter) : null;
  return {
    externalId: c.id ?? c.code ?? c.name,
    game: "ONE_PIECE",
    set: setName(c) || "One Piece",
    number: c.code ?? c.id ?? "—",
    name: c.name,
    variant: suffix ? `Alt art (${suffix})` : null,
    finish: null,
    imageUrl: c.images?.large ?? c.images?.small ?? c.image ?? null,
    description: desc || null,
    rarity: c.rarity ?? null,
    cardType: [titleCase(c.type), c.family].filter(Boolean).join(" · ") || null,
    cost: c.cost != null ? String(c.cost) : null,
    power: c.power != null ? String(c.power) : null,
    counter,
  };
}
