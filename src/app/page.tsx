import Link from "next/link";
import { CardTile } from "@/components/card-tile";
import { formatAud } from "@/lib/pricing";
import {
  getCurrentUser,
  getDashboardStats,
  getInventoryForUser,
} from "@/lib/queries";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [stats, inventory] = await Promise.all([
    getDashboardStats(user.id),
    getInventoryForUser(user.id),
  ]);
  const preview = inventory.slice(0, 4);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-muted text-sm">Welcome back,</p>
        <h1 className="text-2xl font-semibold">{user.displayName}</h1>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span className="rounded bg-surface-2 border border-border px-2 py-0.5">
            Trust tier {user.trustTier}
          </span>
          <span className="rounded bg-surface-2 border border-border px-2 py-0.5">
            KYC {user.kycStatus}
          </span>
          {user.ratingAvg != null && <span>★ {user.ratingAvg.toFixed(1)}</span>}
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Cards owned" value={String(stats.cardCount)} />
        <Stat label="Listed to trade" value={String(stats.listedCount)} />
        <Stat label="Collection value" value={formatAud(stats.collectionValueCents)} />
        <Stat label="Catalog size" value={String(stats.catalogSize)} />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-medium">How it works</h2>
        <p className="text-sm text-muted mt-1">
          Trade Pokémon and One Piece cards — only for other cards, never cash.
          Market values help you compare, but never block a trade: if both sides
          are happy, it&apos;s a deal.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Your collection</h2>
          <Link href="/collection" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        {preview.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {preview.map((item) => (
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
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
      No cards yet — head to “Add cards” to build your collection.
    </div>
  );
}
