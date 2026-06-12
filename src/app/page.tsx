import Link from "next/link";
import { CardTile } from "@/components/card-tile";
import { IconAdd, IconCollection, IconLayers, IconShield, IconTag, IconWallet } from "@/components/icons";
import { csAud } from "@/lib/format";
import {
  getCompletedTradeCount,
  getCurrentUser,
  getDashboardStats,
  getInventoryForUser,
} from "@/lib/queries";
import { firstName, trustLabel } from "@/lib/display";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [stats, inventory, trades] = await Promise.all([
    getDashboardStats(user.id),
    getInventoryForUser(user.id),
    getCompletedTradeCount(user.id),
  ]);
  const preview = inventory.slice(0, 6);

  return (
    <div>
      <section className="cs-hero">
        <div className="cs-panel cs-greet">
          <div className="cs-eyebrow cs-greet-eyebrow">Welcome back</div>
          <h1 className="cs-h1">Good day, {firstName(user.displayName)}.</h1>
          <div className="cs-trust-row">
            <span className="cs-trust-chip">
              <IconShield /> <b>{trustLabel(user.trustTier)}</b>
            </span>
            <span className="cs-trust-chip">
              <span className="cs-rating-stars">{"★".repeat(Math.round(user.ratingAvg ?? 5))}</span>
              <b>{(user.ratingAvg ?? 5).toFixed(1)}</b>
              <span className="cs-muted">· {trades} trade{trades === 1 ? "" : "s"}</span>
            </span>
          </div>
        </div>

        <div className="cs-stats">
          <Stat icon={<IconCollection />} label="Cards owned" value={String(stats.cardCount)} />
          <Stat icon={<IconTag />} label="Listed to trade" value={String(stats.listedCount)} />
          <Stat icon={<IconWallet />} label="Collection value" value={csAud(stats.collectionValueCents)} />
          <Stat icon={<IconLayers />} label="Catalog size" value={String(stats.catalogSize)} />
        </div>
      </section>

      <div className="cs-section-head">
        <h2 className="cs-section-title">Your collection</h2>
        <Link href="/collection" className="cs-link">View all →</Link>
      </div>

      <div className="cs-grid">
        {preview.map((item) => (
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
        <Link href="/add" className="cs-add-tile">
          <span className="chip"><IconAdd /></span>
          Add a card
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="cs-panel cs-stat">
      <div className="cs-stat-label">{icon} {label}</div>
      <div className="cs-stat-value">{value}</div>
    </div>
  );
}
