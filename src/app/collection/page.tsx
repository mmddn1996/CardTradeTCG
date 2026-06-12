import Link from "next/link";
import { CardTile } from "@/components/card-tile";
import { IconAdd, IconLayers } from "@/components/icons";
import { getCurrentUser, getInventoryForUser } from "@/lib/queries";

export const metadata = { title: "My Collection — CardSwap" };

const GAME_FILTERS = [
  ["", "All games"],
  ["POKEMON", "Pokémon TCG"],
  ["ONE_PIECE", "One Piece"],
] as const;
const STATUS_FILTERS = [
  ["", "All"],
  ["LISTED", "Listed"],
  ["VAULT", "In vault"],
] as const;

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const all = await getInventoryForUser(user.id);
  const items = all.filter(
    (i) =>
      (!sp.game || i.catalogCard.game === sp.game) &&
      (!sp.status || i.status === sp.status),
  );

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const g = over.game ?? sp.game ?? "";
    const s = over.status ?? sp.status ?? "";
    if (g) p.set("game", g);
    if (s) p.set("status", s);
    const str = p.toString();
    return str ? `/collection?${str}` : "/collection";
  };

  return (
    <div>
      <div className="cs-page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="cs-eyebrow">My Collection</div>
          <h1 className="cs-h1" style={{ fontSize: 30 }}>{all.length} card{all.length === 1 ? "" : "s"}</h1>
        </div>
        <Link href="/add" className="cs-btn cs-btn-primary"><IconAdd /> Add card</Link>
      </div>

      <div className="cs-searchbar">
        <div className="cs-filterchips">
          {GAME_FILTERS.map(([val, label]) => (
            <Link key={val} href={qs({ game: val })} className={`cs-fchip${(sp.game ?? "") === val ? " on" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
        <div className="cs-seg" style={{ marginLeft: "auto" }}>
          {STATUS_FILTERS.map(([val, label]) => (
            <Link key={val} href={qs({ status: val })} className={(sp.status ?? "") === val ? "on" : ""}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-icon"><IconLayers /></div>
          <h3>Nothing here yet</h3>
          <p>Head to “Add cards” to build your collection.</p>
        </div>
      ) : (
        <div className="cs-grid">
          {items.map((item) => (
            <CardTile
              key={item.id}
              card={{
                catalogId: item.catalogCardId,
                name: item.catalogCard.name,
                game: item.catalogCard.game,
                set: item.catalogCard.set,
                number: item.catalogCard.number,
                imageUrl: item.catalogCard.imageUrl,
                cardType: item.catalogCard.cardType,
                condition: item.condition,
                valueCents: item.value?.valueCents ?? null,
                asOf: item.value?.capturedAt ?? null,
                state: item.status,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
