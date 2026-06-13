import type { ConditionBand, Game } from "@/lib/enums";
import { completeBands } from "@/lib/pricing";
import { usdToAudCents } from "./fx";
import { fetchJson } from "./http";
import type { PriceRef, PriceResult, PricingProvider } from "./types";

const BASE = process.env.JUSTTCG_API_BASE ?? "https://api.justtcg.com/v1";

// JustTCG game slugs (One Piece confirmed; Pokémon overridable via env).
const GAME_SLUG: Record<Game, string> = {
  POKEMON: process.env.JUSTTCG_SLUG_POKEMON ?? "pokemon",
  ONE_PIECE: process.env.JUSTTCG_SLUG_ONE_PIECE ?? "one-piece-card-game",
};

interface JtVariant {
  condition?: string;
  printing?: string;
  language?: string;
  price?: number; // USD
  avgPrice?: number;
}
interface JtCard {
  id?: string;
  name?: string;
  number?: string; // e.g. "71/99" (Pokémon) or "OP01-001" (One Piece)
  set?: string; // slug, e.g. "arceus-pokemon"
  set_name?: string; // display, e.g. "Arceus"
  variants?: JtVariant[];
}

/**
 * JustTCG pricing provider (https://justtcg.com) — a single price source for
 * both games (Spec §4.5 pluggable pricing). Prices are quoted in USD per
 * condition; we map conditions to our bands, convert to AUD cents, and fill any
 * missing band from Near-Mint. Field names follow JustTCG's documented shape
 * and are read defensively. Fails closed (null) when unreachable → card stays
 * unpriced (Spec §4.6).
 */
export class JustTcgPricingProvider implements PricingProvider {
  readonly key = "JUSTTCG";

  private headers(): Record<string, string> {
    const apiKey = process.env.JUSTTCG_API_KEY;
    return apiKey ? { "X-API-Key": apiKey } : {};
  }

  async getPrice(ref: PriceRef): Promise<PriceResult | null> {
    const slug = GAME_SLUG[ref.game];
    // JustTCG's `q` searches the card name, so query by name for both games
    // (punctuation like "Monkey.D.Luffy" normalised to spaces), then match the
    // specific printing by collector number below.
    const query = cleanName(ref.name);
    const res = await fetchJson<{ data?: JtCard[] }>(
      `${BASE}/cards?game=${slug}&q=${encodeURIComponent(query)}&limit=100`,
      { headers: this.headers() },
    );
    const cards = res?.data ?? [];
    if (cards.length === 0) return null;

    const card = bestMatch(cards, ref);
    if (!card?.variants?.length) return null;

    const byBand = bandsFromVariants(card.variants, ref.finish);
    if (Object.keys(byBand).length === 0) return null;

    return {
      byBand: completeBands(byBand),
      source: this.key,
      capturedAt: new Date(),
    };
  }
}

/** Pick the result that best matches the requested card. A name search can
 * return many cards (esp. Pokémon), so match on collector number — comparing
 * the base number before any "/NN" set total — and prefer a matching set. */
function bestMatch(cards: JtCard[], ref: PriceRef): JtCard | undefined {
  const wantNum = baseNumber(ref.number);
  const wantSet = normalize(ref.set);

  const numberMatches = cards.filter(
    (c) => wantNum !== "" && baseNumber(c.number ?? "") === wantNum,
  );
  if (numberMatches.length > 0) {
    return (
      numberMatches.find((c) => setMatches(c, wantSet)) ?? numberMatches[0]
    );
  }
  return cards.find((c) => setMatches(c, wantSet)) ?? cards[0];
}

/** The card number before the "/NN" set total, normalized (e.g. "71/99"→"71",
 * "OP01-001"→"op01001"). */
function baseNumber(num: string): string {
  return normalize(num.split("/")[0]);
}

function setMatches(c: JtCard, wantSet: string): boolean {
  if (!wantSet) return false;
  const s = normalize(c.set_name ?? c.set ?? "");
  return s !== "" && (s.includes(wantSet) || wantSet.includes(s));
}

/** Collapse JustTCG's per-condition variants into our four bands (AUD cents).
 * Prefer English variants (avoid pricing off a Japanese printing), then prefer
 * the printing matching the catalog finish (e.g. Holofoil). Uses `price`, or
 * `avgPrice` as a fallback. */
function bandsFromVariants(
  variants: JtVariant[],
  finish?: string | null,
): Partial<Record<ConditionBand, number>> {
  const out: Partial<Record<ConditionBand, number>> = {};

  const english = variants.filter(
    (v) => !v.language || /eng/i.test(v.language),
  );
  const pool = english.length > 0 ? english : variants;

  const preferred = finish
    ? pool.filter((v) =>
        (v.printing ?? "").toLowerCase().includes(finish.toLowerCase()),
      )
    : [];

  for (const list of [preferred, pool]) {
    for (const v of list) {
      const band = bandOf(v.condition);
      const usd = typeof v.price === "number" ? v.price : v.avgPrice;
      if (band && out[band] == null && typeof usd === "number" && usd > 0) {
        out[band] = usdToAudCents(usd);
      }
    }
  }
  return out;
}

function bandOf(condition?: string): ConditionBand | null {
  const c = (condition ?? "").toLowerCase();
  if (c.includes("near mint") || c === "nm" || c === "mint") return "NM";
  if (c.includes("lightly")) return "LP";
  if (c.includes("moderately")) return "PL";
  if (c.includes("heavily") || c.includes("damaged") || c.includes("poor"))
    return "PO";
  return null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Name suitable for a fuzzy `q` search: punctuation → spaces (so
 * "Monkey.D.Luffy" → "Monkey D Luffy"); drop a "(Leader)" suffix. */
function cleanName(name: string): string {
  return name
    .replace(/\(.*?\)/g, " ")
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
