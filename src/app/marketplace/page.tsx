import Link from "next/link";
import { CardTile } from "@/components/card-tile";
import { IconSearch } from "@/components/icons";
import { getCurrentUser, getMarketplaceListings } from "@/lib/queries";
import { getSoftLockedInventoryIds } from "@/lib/offers";
import { handleOf, initials } from "@/lib/display";

export const metadata = { title: "Marketplace — CardSwap" };

const GAME_FILTERS = [
  ["", "All games"],
  ["POKEMON", "Pokémon TCG"],
  ["ONE_PIECE", "One Piece"],
] as const;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const [listings, user, softLocked] = await Promise.all([
    getMarketplaceListings(),
    getCurrentUser(),
    getSoftLockedInventoryIds(),
  ]);

  const filtered = listings.filter((l) => {
    if (!l.inventoryCard) return false;
    const cc = l.inventoryCard.catalogCard;
    if (sp.game && cc.game !== sp.game) return false;
    if (q && !`${cc.name} ${cc.set} ${l.user.displayName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const qs = (game: string) => {
    const p = new URLSearchParams();
    if (game) p.set("game", game);
    if (sp.q) p.set("q", sp.q);
    const s = p.toString();
    return s ? `/marketplace?${s}` : "/marketplace";
  };

  return (
    <div>
      <div className="cs-page-head">
        <div className="cs-eyebrow">Marketplace</div>
        <h1 className="cs-h1" style={{ fontSize: 30 }}>Cards listed to trade</h1>
      </div>

      <form method="get" className="cs-searchbar">
        <div className="cs-search">
          <IconSearch />
          <input className="cs-input" name="q" defaultValue={sp.q ?? ""} placeholder="Search cards, sets, owners…" />
          {sp.game && <input type="hidden" name="game" value={sp.game} />}
        </div>
        <div className="cs-filterchips">
          {GAME_FILTERS.map(([val, label]) => (
            <Link key={val} href={qs(val)} className={`cs-fchip${(sp.game ?? "") === val ? " on" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="cs-empty"><h3>No cards match</h3><p>Try a different search or filter.</p></div>
      ) : (
        <div className="cs-grid cs-grid-lg">
          {filtered.map((l) => {
            const inv = l.inventoryCard!;
            const cc = inv.catalogCard;
            const mine = l.userId === user.id;
            const locked = softLocked.has(inv.id);
            return (
              <CardTile
                key={l.id}
                card={{
                  catalogId: cc.id,
                  name: cc.name,
                  game: cc.game,
                  set: cc.set,
                  number: cc.number,
                  imageUrl: cc.imageUrl,
                  condition: inv.condition,
                  valueCents: l.value?.valueCents ?? null,
                  asOf: l.value?.capturedAt ?? null,
                  softLocked: locked,
                  footer: mine ? (
                    <span className="cs-mine-flag">Your listing</span>
                  ) : (
                    <span className="cs-owner">
                      <span className="cs-owner-dot">{initials(l.user.displayName)}</span>
                      @{handleOf(l.user)}
                    </span>
                  ),
                  action: mine ? undefined : locked ? (
                    <button className="cs-btn cs-btn-sm cs-btn-block" disabled>In an active offer</button>
                  ) : (
                    <Link href={`/offers/new?want=${inv.id}`} className="cs-btn cs-btn-primary cs-btn-sm cs-btn-block">
                      Make offer
                    </Link>
                  ),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
