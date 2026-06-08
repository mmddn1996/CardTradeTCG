import type { ConditionBand, Game } from "@/lib/enums";
import { completeBands } from "@/lib/pricing";
import { usdToAudCents } from "./fx";
import { fetchJson } from "./http";
import type { PriceRef, PriceResult, PricingProvider } from "./types";

const BASE = process.env.JUSTTCG_API_BASE ?? "https://api.justtcg.com/v1";

const GAME_SLUG: Record<Game, string> = {
  POKEMON: "pokemon",
  ONE_PIECE: "one-piece",
};

interface JtVariant {
  condition?: string;
  printing?: string;
  price?: number; // USD
}
interface JtCard {
  id?: string;
  name?: string;
  number?: string;
  set?: string;
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
    // The code/number is the most selective query for One Piece; for Pokémon
    // the name is more reliable, then we match on collector number.
    const query = ref.game === "ONE_PIECE" ? ref.number : ref.name;
    const res = await fetchJson<{ data?: JtCard[] }>(
      `${BASE}/cards?game=${slug}&q=${encodeURIComponent(query)}&limit=20`,
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

/** Pick the result whose collector number best matches the requested card. */
function bestMatch(cards: JtCard[], ref: PriceRef): JtCard | undefined {
  const want = normalize(ref.number);
  const byNumber = cards.find((c) => {
    const n = normalize(c.number ?? "");
    return n && (n === want || n.endsWith(want) || want.endsWith(n));
  });
  return byNumber ?? cards[0];
}

/** Collapse JustTCG's per-condition variants into our four bands (AUD cents). */
function bandsFromVariants(
  variants: JtVariant[],
  finish?: string | null,
): Partial<Record<ConditionBand, number>> {
  const out: Partial<Record<ConditionBand, number>> = {};
  // Prefer variants whose printing matches the catalog finish (e.g. Holofoil).
  const preferred = finish
    ? variants.filter((v) =>
        (v.printing ?? "").toLowerCase().includes(finish.toLowerCase()),
      )
    : [];
  for (const list of [preferred, variants]) {
    for (const v of list) {
      const band = bandOf(v.condition);
      if (band && out[band] == null && typeof v.price === "number" && v.price > 0) {
        out[band] = usdToAudCents(v.price);
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
