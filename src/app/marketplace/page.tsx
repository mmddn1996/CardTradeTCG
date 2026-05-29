import { CardTile } from "@/components/card-tile";
import { getMarketplaceListings } from "@/lib/queries";

export const metadata = { title: "Marketplace — CardSwap" };

export default async function MarketplacePage() {
  const listings = await getMarketplaceListings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted">
          Cards listed as available to trade (HAVE). Making offers arrives in
          Stage 3.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
          No cards listed for trade yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {listings.map((l) =>
            l.inventoryCard ? (
              <CardTile
                key={l.id}
                card={{
                  catalogId: l.inventoryCard.catalogCardId,
                  name: l.inventoryCard.catalogCard.name,
                  set: l.inventoryCard.catalogCard.set,
                  number: l.inventoryCard.catalogCard.number,
                  game: l.inventoryCard.catalogCard.game,
                  variant: l.inventoryCard.catalogCard.variant,
                  finish: l.inventoryCard.catalogCard.finish,
                  imageUrl: l.inventoryCard.catalogCard.imageUrl,
                  condition: l.inventoryCard.condition,
                  value: l.value,
                  ownerName: l.user.displayName,
                }}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
