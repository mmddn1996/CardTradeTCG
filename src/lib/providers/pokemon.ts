import { fetchJson } from "./http";
import type { CatalogCardResult, CatalogProvider, SetInfo } from "./types";

const BASE = process.env.POKEMON_TCG_API_BASE ?? "https://api.pokemontcg.io/v2";

interface PokeCard {
  id: string;
  name: string;
  number: string;
  set?: { id: string; name: string };
  images?: { small?: string; large?: string };
  tcgplayer?: { prices?: Record<string, unknown> };
  flavorText?: string;
  rules?: string[];
  abilities?: { name: string; text: string }[];
  attacks?: { name: string; damage?: string; text?: string }[];
  rarity?: string;
  hp?: string;
  supertype?: string;
  subtypes?: string[];
  types?: string[];
}

/**
 * Pokémon TCG API catalog provider (https://pokemontcg.io) — identity + art.
 * Keyless (an optional key raises rate limits). Pricing is handled separately
 * by the JustTCG pricing provider. Fails closed (null/[]) when the host is
 * unreachable so callers degrade to the mock / catalog-gap path.
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

  async lookupBySet(setCode: string): Promise<CatalogCardResult[]> {
    const list = await fetchJson<{ data: PokeCard[] }>(
      `${BASE}/cards?q=${encodeURIComponent(`set.id:${setCode.trim()}`)}&pageSize=250&orderBy=number`,
      { headers: this.headers() },
    );
    return (list?.data ?? []).map(toResult);
  }

  async listSets(): Promise<SetInfo[]> {
    const res = await fetchJson<{ data: { id: string; name: string }[] }>(
      `${BASE}/sets?orderBy=-releaseDate&pageSize=100`,
      { headers: this.headers() },
    );
    return (res?.data ?? []).map((s) => ({
      code: s.id,
      name: s.name,
      game: "POKEMON" as const,
    }));
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
    description: describe(c),
    rarity: c.rarity ?? null,
    cardType: [c.types?.join("/"), c.subtypes?.join(" ")].filter(Boolean).join(" · ") || null,
    power: c.hp ? `${c.hp} HP` : null,
  };
}

/** Build readable rules text from abilities, attacks, rule boxes and flavour. */
function describe(c: PokeCard): string | null {
  const parts: string[] = [];
  for (const a of c.abilities ?? []) parts.push(`${a.name}: ${a.text}`);
  for (const a of c.attacks ?? []) {
    const dmg = a.damage ? ` (${a.damage})` : "";
    parts.push(`${a.name}${dmg}${a.text ? `: ${a.text}` : ""}`);
  }
  for (const r of c.rules ?? []) parts.push(r);
  if (parts.length === 0 && c.flavorText) parts.push(c.flavorText);
  return parts.length ? parts.join("\n") : null;
}
