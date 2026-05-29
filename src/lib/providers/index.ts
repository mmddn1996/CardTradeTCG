import type { Game } from "@/lib/enums";
import { MockProvider } from "./mock";
import { PokemonTcgProvider } from "./pokemon";
import { OnePieceProvider } from "./onepiece";
import type { CatalogProvider } from "./types";

export type { CatalogProvider, CatalogCardResult, PriceResult } from "./types";

/**
 * Provider registry. The active set is chosen by `CARDSWAP_PROVIDERS`:
 *   - "mock" (default): fully offline seeded data — works without network.
 *   - "live": real HTTP providers (Pokémon TCG API, One Piece). Requires the
 *     API hosts to be allowlisted in the environment's network policy.
 *
 * Callers never branch on the mode — this is the only place external data
 * sources are selected (Spec §4.5).
 */
export function getProvider(game: Game): CatalogProvider {
  const mode = process.env.CARDSWAP_PROVIDERS ?? "mock";
  if (mode === "live") {
    switch (game) {
      case "POKEMON":
        return new PokemonTcgProvider();
      case "ONE_PIECE":
        return new OnePieceProvider();
    }
  }
  return new MockProvider(game);
}
