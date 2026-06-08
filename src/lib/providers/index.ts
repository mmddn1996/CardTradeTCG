import type { Game } from "@/lib/enums";
import { MockProvider } from "./mock";
import { PokemonTcgProvider } from "./pokemon";
import { OnePieceProvider } from "./onepiece";
import { JustTcgPricingProvider } from "./justtcg";
import type { CatalogProvider, PricingProvider } from "./types";

export type {
  CatalogProvider,
  CatalogCardResult,
  PricingProvider,
  PriceRef,
  PriceResult,
} from "./types";

function live(): boolean {
  return (process.env.CARDSWAP_PROVIDERS ?? "mock") === "live";
}

/**
 * Catalog (identity + art) provider per game. "live" requires the per-game API
 * hosts to be allowlisted; "mock" (default) is fully offline.
 */
export function getCatalogProvider(game: Game): CatalogProvider {
  if (live()) {
    switch (game) {
      case "POKEMON":
        return new PokemonTcgProvider();
      case "ONE_PIECE":
        return new OnePieceProvider();
    }
  }
  return new MockProvider(game);
}

/**
 * Pricing provider (one source for all games). Live mode uses JustTCG; mock
 * mode prices from the seeded catalog. This is the only place a price source is
 * chosen (Spec §4.5).
 */
export function getPricingProvider(game: Game): PricingProvider {
  return live() ? new JustTcgPricingProvider() : new MockProvider(game);
}
