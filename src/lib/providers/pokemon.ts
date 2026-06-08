import { pricesFromNM } from "@/lib/pricing";
import { eurToAudCents, usdToAudCents } from "./fx";
import { fetchJson } from "./http";
import type { CatalogCardResult, CatalogProvider, PriceResult } from "./types";

const BASE = process.env.POKEMON_TCG_API_BASE ?? "https://api.pokemontcg.io/v2";

interface PokeCard {
  id: string;
  name: string;
  number: string;
  set?: { id: string; name: string };
  images?: { small?: string; large?: string };
  tcgplayer?: {
    prices?: Record<string, { market?: number | null; mid?: number | null }>;
  };
  cardmarket?: { prices?: { trendPrice?: number; averageSellPrice?: number } };
}

/**
 * Pokémon TCG API provider (https://pokemontcg.io). Live external source for
 * Stage 2. Network access to the API host must be allowlisted in the
 * environment for this to resolve; otherwise calls fail closed (return null)
 * and the caller falls back to the mock / catalog-gap path.
 */
export class PokemonTcgProvider implements CatalogProvider {
  readonly key = "POKEMON_TCG_API";
  readonly game = "POKEMON" as const;

  private headers(): Record<string, string> {
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    return apiKey ? { "X-Api-Key": apiKey } : {};
  }

  async lookupByCode(code: string): Promise<CatalogCardResult | null> {
    const c = code.trim();
    // The API id form (e.g. "base1-4") resolves directly.
    const direct = await fetchJson<{ data: PokeCard }>(
      `${BASE}/cards/${encodeURIComponent(c)}`,
      { headers: this.headers() },
    );
    if (direct?.data) return toResult(direct.data);

    // Otherwise treat it as a collector number (e.g. "4" or "4/102").
    const num = c.split("/")[0];
    const list = await fetchJson<{ data: PokeCard[] }>(
      `${BASE}/cards?q=${encodeURIComponent(`number:"${num}"`)}&pageSize=1`,
      { headers: this.headers() },
    );
    return list?.data?.[0] ? toResult(list.data[0]) : null;
  }

  async search(query: string): Promise<CatalogCardResult[]> {
    // AND a wildcard clause per word so multi-word names match (the API treats
    // whitespace as AND); quotes around wildcards break matching, so avoid them.
    const clause = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => `name:*${t}*`)
      .join(" ");
    const list = await fetchJson<{ data: PokeCard[] }>(
      `${BASE}/cards?q=${encodeURIComponent(clause)}&pageSize=20&orderBy=-set.releaseDate`,
      { headers: this.headers() },
    );
    return (list?.data ?? []).map(toResult);
  }

  async getPrice(externalId: string): Promise<PriceResult | null> {
    const res = await fetchJson<{ data: PokeCard }>(
      `${BASE}/cards/${encodeURIComponent(externalId)}`,
      { headers: this.headers() },
    );
    const card = res?.data;
    if (!card) return null;
    const nmCents = nmPriceAudCents(card);
    if (nmCents == null) return null;
    return {
      byBand: pricesFromNM(nmCents),
      source: this.key,
      capturedAt: new Date(),
    };
  }
}

function toResult(c: PokeCard): CatalogCardResult {
  const finishKeys = Object.keys(c.tcgplayer?.prices ?? {});
  const finish = finishKeys.includes("holofoil")
    ? "Holofoil"
    : finishKeys.includes("reverseHolofoil")
      ? "Reverse Holofoil"
      : "Normal";
  return {
    externalId: c.id,
    game: "POKEMON",
    set: c.set?.name ?? c.set?.id ?? "Unknown set",
    number: c.number,
    name: c.name,
    variant: null,
    finish,
    imageUrl: c.images?.large ?? c.images?.small ?? null,
  };
}

/** Best Near-Mint price in AUD cents: prefer TCGplayer market (USD), fall back
 * to Cardmarket trend (EUR). */
function nmPriceAudCents(c: PokeCard): number | null {
  const tcg = c.tcgplayer?.prices;
  if (tcg) {
    const order = ["holofoil", "normal", "reverseHolofoil"];
    for (const k of order) {
      const p = tcg[k]?.market ?? tcg[k]?.mid;
      if (p != null && p > 0) return usdToAudCents(p);
    }
    for (const k of Object.keys(tcg)) {
      const p = tcg[k]?.market ?? tcg[k]?.mid;
      if (p != null && p > 0) return usdToAudCents(p);
    }
  }
  const cm = c.cardmarket?.prices?.trendPrice ?? c.cardmarket?.prices?.averageSellPrice;
  if (cm != null && cm > 0) return eurToAudCents(cm);
  return null;
}
