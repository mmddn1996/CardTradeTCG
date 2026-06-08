import Link from "next/link";
import { CardImage } from "@/components/card-image";
import { GameBadge } from "@/components/badges";
import { ValueBadge } from "@/components/value-badge";
import { getCurrentUser, getMarketplaceListings } from "@/lib/queries";
import { getSoftLockedInventoryIds } from "@/lib/offers";

export const metadata = { title: "Marketplace — CardSwap" };

export default async function MarketplacePage() {
  const [listings, user, softLocked] = await Promise.all([
    getMarketplaceListings(),
    getCurrentUser(),
    getSoftLockedInventoryIds(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted">
          Cards listed as available to trade (HAVE). Tap “Make offer” to start a
          card-for-card negotiation.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
          No cards listed for trade yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {listings.map((l) => {
            if (!l.inventoryCard) return null;
            const cc = l.inventoryCard.catalogCard;
            const mine = l.userId === user.id;
            const locked = softLocked.has(l.inventoryCard.id);
            return (
              <div
                key={l.id}
                className="flex flex-col rounded-xl border border-border bg-surface p-3"
              >
                <Link href={`/cards/${cc.id}`}>
                  <CardImage src={cc.imageUrl} alt={cc.name} className="w-full" />
                </Link>
                <div className="mt-2 flex items-center gap-1.5">
                  <GameBadge game={cc.game} />
                  {locked && (
                    <span className="text-[10px] rounded bg-warning/15 text-warning px-1.5 py-0.5">
                      in an active offer
                    </span>
                  )}
                </div>
                <div className="mt-1 font-medium leading-tight truncate">{cc.name}</div>
                <div className="text-xs text-muted">
                  {cc.set} · {cc.number}
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <ValueBadge value={l.value} size="sm" />
                  <span className="text-[11px] text-muted">{l.user.displayName}</span>
                </div>
                <div className="mt-2">
                  {mine ? (
                    <span className="text-[11px] text-muted">Your card</span>
                  ) : (
                    <Link
                      href={`/offers/new?want=${l.inventoryCard.id}`}
                      className="inline-block w-full text-center rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-medium"
                    >
                      Make offer
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
