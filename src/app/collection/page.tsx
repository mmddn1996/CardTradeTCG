import Link from "next/link";
import { CardTile } from "@/components/card-tile";
import { getCurrentUser, getInventoryForUser } from "@/lib/queries";

export const metadata = { title: "My Collection — CardSwap" };

export default async function CollectionPage() {
  const user = await getCurrentUser();
  const inventory = await getInventoryForUser(user.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Collection</h1>
          <p className="text-sm text-muted">
            {inventory.length} card{inventory.length === 1 ? "" : "s"} digitised
          </p>
        </div>
        <Link
          href="/add"
          className="rounded-lg bg-accent-strong px-3 py-2 text-sm font-medium"
        >
          + Add card
        </Link>
      </div>

      {inventory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
          No cards yet.{" "}
          <Link href="/" className="text-accent hover:underline">
            Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {inventory.map((item) => (
            <CardTile
              key={item.id}
              card={{
                catalogId: item.catalogCardId,
                name: item.catalogCard.name,
                set: item.catalogCard.set,
                number: item.catalogCard.number,
                game: item.catalogCard.game,
                variant: item.catalogCard.variant,
                finish: item.catalogCard.finish,
                imageUrl: item.catalogCard.imageUrl,
                condition: item.condition,
                status: item.status,
                value: item.value,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
