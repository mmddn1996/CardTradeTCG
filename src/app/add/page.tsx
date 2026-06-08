import Link from "next/link";
import { AddResultForm } from "@/components/add-result-form";
import { ManualAddForm } from "@/components/manual-add-form";
import { cardsInSet, listSets, lookupCards } from "@/lib/catalog";
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
  searchParams: Promise<{ game?: string; q?: string; set?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const game: Game = GameSchema.safeParse(sp.game).success
    ? (sp.game as Game)
    : "POKEMON";
  const q = (sp.q ?? "").trim();
  const set = (sp.set ?? "").trim();
  const browsing = sp.view === "sets" || !!set;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Add a card</h1>
        <p className="text-sm text-muted">
          Search by name or code, or browse a whole set. Prices attach
          automatically — they&apos;re reference data only.
        </p>
      </div>

      {/* Game selector */}
      <div className="flex gap-1">
        {GAMES.map((g) => (
          <Tab key={g} href={`/add?game=${g}${browsing ? "&view=sets" : ""}`} active={g === game}>
            {GAME_LABEL[g]}
          </Tab>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-sm">
        <Toggle href={`/add?game=${game}`} active={!browsing}>
          Search
        </Toggle>
        <Toggle href={`/add?game=${game}&view=sets`} active={browsing}>
          Browse sets
        </Toggle>
      </div>

      {browsing ? (
        set ? (
          <SetCards game={game} set={set} />
        ) : (
          <SetList game={game} />
        )
      ) : (
        <SearchView game={game} q={q} />
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

async function SearchView({ game, q }: { game: Game; q: string }) {
  const results = q ? await lookupCards(game, q) : [];
  return (
    <>
      <form method="get" className="flex gap-2">
        <input type="hidden" name="game" value={game} />
        <input
          name="q"
          defaultValue={q}
          placeholder={PLACEHOLDER[game]}
          className="flex-1 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-foreground"
        />
        <button type="submit" className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium">
          Search
        </button>
      </form>

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
    </>
  );
}

async function SetList({ game }: { game: Game }) {
  const sets = await listSets(game);
  if (sets.length === 0) {
    return (
      <p className="text-sm text-muted rounded-xl border border-dashed border-border p-6 text-center">
        No sets available to browse{" "}
        {game === "ONE_PIECE" ? "(needs live mode + apitcg)" : ""}. Try search
        instead.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {sets.map((s) => (
        <Link
          key={s.code}
          href={`/add?game=${game}&set=${encodeURIComponent(s.code)}`}
          className="rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent transition-colors"
        >
          <div className="font-medium text-sm leading-tight">{s.name}</div>
          <div className="text-[11px] text-muted">{s.code}</div>
        </Link>
      ))}
    </div>
  );
}

async function SetCards({ game, set }: { game: Game; set: string }) {
  const cards = await cardsInSet(game, set);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {cards.length} card{cards.length === 1 ? "" : "s"} in {set}
        </p>
        <Link href={`/add?game=${game}&view=sets`} className="text-xs text-accent hover:underline">
          ← All sets
        </Link>
      </div>
      {cards.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {cards.map((r) => (
            <AddResultForm key={r.externalId} card={r} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No cards found for this set.</p>
      )}
    </section>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm ${
        active ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function Toggle({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-md ${
        active ? "bg-accent-strong text-white" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
