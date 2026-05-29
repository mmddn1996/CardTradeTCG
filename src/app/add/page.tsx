import Link from "next/link";
import { AddResultForm } from "@/components/add-result-form";
import { ManualAddForm } from "@/components/manual-add-form";
import { lookupCards } from "@/lib/catalog";
import { GAME_LABEL, GameSchema, type Game } from "@/lib/enums";

export const metadata = { title: "Add a card — CardSwap" };

const GAMES: Game[] = ["POKEMON", "ONE_PIECE"];

const PLACEHOLDER: Record<Game, string> = {
  POKEMON: "Name, number, or id — e.g. Charizard, 4/102, base1-4",
  ONE_PIECE: "Name or card id — e.g. Luffy, OP01-001",
};

export default async function AddCardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const game: Game = GameSchema.safeParse(sp.game).success
    ? (sp.game as Game)
    : "POKEMON";
  const q = (sp.q ?? "").trim();

  const results = q ? await lookupCards(game, q) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Add a card</h1>
        <p className="text-sm text-muted">
          Look up by code or name. Live prices attach automatically; values are
          reference data only.
        </p>
      </div>

      {/* Game selector */}
      <div className="flex gap-1">
        {GAMES.map((g) => (
          <Link
            key={g}
            href={`/add?game=${g}`}
            className={`px-3 py-1.5 rounded-md text-sm ${
              g === game
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {GAME_LABEL[g]}
          </Link>
        ))}
      </div>

      {/* Lookup form (GET → searchParams) */}
      <form method="get" className="flex gap-2">
        <input type="hidden" name="game" value={game} />
        <input
          name="q"
          defaultValue={q}
          placeholder={PLACEHOLDER[game]}
          className="flex-1 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {q && (
        <section className="space-y-3">
          <p className="text-xs text-muted">
            {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
          </p>

          {results.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {results.map((r) => (
                <AddResultForm key={r.externalId} card={r} />
              ))}
            </div>
          ) : (
            <ManualAddForm game={game} defaultQuery={q} />
          )}
        </section>
      )}

      <p className="text-xs text-muted">
        Looking for the review queue?{" "}
        <Link href="/catalog-gaps" className="text-accent hover:underline">
          Catalog gaps
        </Link>
      </p>
    </div>
  );
}
