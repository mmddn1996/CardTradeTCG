import Link from "next/link";
import { AddResultForm } from "@/components/add-result-form";
import { ManualAddForm } from "@/components/manual-add-form";
import { IconCamera, IconSearch } from "@/components/icons";
import { cardsInSet, listSets, lookupCards } from "@/lib/catalog";
import { GAME_LABEL, GameSchema, type Game } from "@/lib/enums";

export const metadata = { title: "Add cards — CardSwap" };

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
  const game: Game = GameSchema.safeParse(sp.game).success ? (sp.game as Game) : "POKEMON";
  const q = (sp.q ?? "").trim();
  const set = (sp.set ?? "").trim();
  const view = sp.view ?? (set ? "sets" : "search");

  return (
    <div>
      <div className="cs-page-head">
        <div className="cs-eyebrow">Add cards</div>
        <h1 className="cs-h1" style={{ fontSize: 30 }}>Digitise your collection</h1>
      </div>

      <div className="cs-searchbar">
        <div className="cs-filterchips">
          {GAMES.map((g) => (
            <Link key={g} href={`/add?game=${g}${view === "sets" ? "&view=sets" : view === "scan" ? "&view=scan" : ""}`}
              className={`cs-fchip${g === game ? " on" : ""}`}>
              {GAME_LABEL[g]}
            </Link>
          ))}
        </div>
        <div className="cs-seg" style={{ marginLeft: "auto" }}>
          <Link href={`/add?game=${game}`} className={view === "search" ? "on" : ""}>Search by name</Link>
          <Link href={`/add?game=${game}&view=sets`} className={view === "sets" ? "on" : ""}>Browse sets</Link>
          <Link href={`/add?game=${game}&view=scan`} className={view === "scan" ? "on" : ""}>Scan (soon)</Link>
        </div>
      </div>

      {view === "scan" ? (
        <div className="cs-empty">
          <div className="cs-empty-icon"><IconCamera /></div>
          <h3>Card scanning is coming soon</h3>
          <p>Point your phone at a card to add it instantly. For now, search or browse sets.</p>
        </div>
      ) : view === "sets" ? (
        set ? <SetCards game={game} set={set} /> : <SetList game={game} />
      ) : (
        <SearchView game={game} q={q} placeholder={PLACEHOLDER[game]} />
      )}

      <p className="cs-muted" style={{ fontSize: 12, marginTop: 24 }}>
        Review queue: <Link href="/catalog-gaps" className="cs-link">Catalog gaps</Link>
      </p>
    </div>
  );
}

async function SearchView({ game, q, placeholder }: { game: Game; q: string; placeholder: string }) {
  const results = q ? await lookupCards(game, q) : [];
  return (
    <>
      <form method="get" className="cs-searchbar">
        <input type="hidden" name="game" value={game} />
        <div className="cs-search">
          <IconSearch />
          <input className="cs-input" name="q" defaultValue={q} placeholder={placeholder} />
        </div>
        <button type="submit" className="cs-btn cs-btn-primary">Search</button>
      </form>
      {q && (
        <>
          <p className="cs-muted" style={{ fontSize: 12, marginBottom: 14 }}>
            {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
          </p>
          {results.length > 0 ? (
            <div className="cs-grid cs-grid-lg">
              {results.map((r) => <AddResultForm key={r.externalId} card={r} />)}
            </div>
          ) : (
            <ManualAddForm game={game} defaultQuery={q} />
          )}
        </>
      )}
    </>
  );
}

async function SetList({ game }: { game: Game }) {
  const sets = await listSets(game);
  if (sets.length === 0) {
    return (
      <div className="cs-empty">
        <h3>No sets to browse</h3>
        <p>{game === "ONE_PIECE" ? "Needs live mode + apitcg." : "Try search instead."}</p>
      </div>
    );
  }
  return (
    <div className="cs-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))" }}>
      {sets.map((s) => (
        <Link key={s.code} href={`/add?game=${game}&set=${encodeURIComponent(s.code)}`} className="cs-panel" style={{ padding: "16px 18px" }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>{s.name}</div>
          <div className="cs-muted" style={{ fontSize: 11 }}>{s.code}</div>
        </Link>
      ))}
    </div>
  );
}

async function SetCards({ game, set }: { game: Game; set: string }) {
  const cards = await cardsInSet(game, set);
  return (
    <>
      <div className="cs-section-head">
        <p className="cs-muted" style={{ fontSize: 12 }}>{cards.length} card{cards.length === 1 ? "" : "s"} in {set}</p>
        <Link href={`/add?game=${game}&view=sets`} className="cs-link">← All sets</Link>
      </div>
      {cards.length > 0 ? (
        <div className="cs-grid cs-grid-lg">
          {cards.map((r) => <AddResultForm key={r.externalId} card={r} />)}
        </div>
      ) : (
        <p className="cs-muted">No cards found for this set.</p>
      )}
    </>
  );
}
