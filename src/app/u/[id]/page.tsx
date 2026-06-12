import Link from "next/link";
import { notFound } from "next/navigation";
import { CardTile } from "@/components/card-tile";
import { CardArt } from "@/components/ui";
import { IconCollection, IconLayers, IconShield, IconTag, IconWallet } from "@/components/icons";
import { csAud } from "@/lib/format";
import { ENTITY_LABEL, type EntityType } from "@/lib/enums";
import { handleOf, initials, trustLabel } from "@/lib/display";
import {
  getProfileHeader,
  getProfileInventory,
  getTradeAggregates,
  type GameMix,
  type ProfileTrade,
} from "@/lib/profile";

const INV_FILTERS = [
  ["have", "Trading With"],
  ["want", "Trading For"],
  ["all", "Full Inventory"],
] as const;

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; filter?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const view = sp.view === "dashboard" ? "dashboard" : "inventory";
  const filter = (["have", "want", "all"].includes(sp.filter ?? "") ? sp.filter : "have") as
    | "have" | "want" | "all";

  const header = await getProfileHeader(id);
  if (!header) notFound();
  const u = header.user;

  return (
    <div>
      {/* ---------- Header / banner ---------- */}
      <section className="cs-panel cs-greet" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <span className="cs-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{initials(u.displayName)}</span>
          <div>
            <div className="cs-eyebrow">@{handleOf(u)} · {ENTITY_LABEL[u.entityType as EntityType] ?? u.entityType}</div>
            <h1 className="cs-h1" style={{ fontSize: 32 }}>{u.displayName}</h1>
          </div>
        </div>
        <div className="cs-trust-row">
          <span className="cs-trust-chip"><IconShield /> <b>{trustLabel(u.trustTier)}</b></span>
          <span className="cs-trust-chip">
            <span className="cs-rating-stars">{"★".repeat(Math.round(u.ratingAvg ?? 5))}</span>
            <b>{(u.ratingAvg ?? 5).toFixed(1)}</b>
            <span className="cs-muted">· {header.tradeCount} trade{header.tradeCount === 1 ? "" : "s"}</span>
          </span>
          <GameMixChip mix={header.gameMix} />
        </div>
      </section>

      <section className="cs-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <Stat icon={<IconCollection />} label="Cards owned" value={String(header.cardCount)} />
        <Stat icon={<IconTag />} label="Listed to trade" value={String(header.listedCount)} />
        <Stat icon={<IconWallet />} label="Collection value" value={csAud(header.collectionValueCents)} />
        <Stat icon={<IconLayers />} label="Catalog size" value={String(header.catalogSize)} />
      </section>

      {/* ---------- View toggle ---------- */}
      <div className="cs-seg" style={{ marginBottom: 18 }}>
        <Link href={`/u/${id}`} className={view === "inventory" ? "on" : ""}>Inventory</Link>
        <Link href={`/u/${id}?view=dashboard`} className={view === "dashboard" ? "on" : ""}>Dashboard</Link>
      </div>

      {view === "inventory" ? (
        <InventoryView id={id} filter={filter} />
      ) : (
        <DashboardView id={id} entityType={u.entityType} />
      )}
    </div>
  );
}

/* ---------------- Inventory view ---------------- */
async function InventoryView({ id, filter }: { id: string; filter: "have" | "want" | "all" }) {
  const cards = await getProfileInventory(id, filter);
  return (
    <div>
      <div className="cs-filterchips" style={{ marginBottom: 18 }}>
        {INV_FILTERS.map(([val, label]) => (
          <Link key={val} href={`/u/${id}?filter=${val}`} className={`cs-fchip${filter === val ? " on" : ""}`}>
            {label}
          </Link>
        ))}
      </div>
      {cards.length === 0 ? (
        <div className="cs-empty">
          <h3>{filter === "want" ? "No wishlist yet" : "Nothing here"}</h3>
          <p>{filter === "want" ? "“Trading For” (wishlist) listings aren’t available yet." : "No cards to show."}</p>
        </div>
      ) : (
        <div className="cs-grid">
          {cards.map((c) => (
            <CardTile
              key={`${c.catalogId}-${c.condition ?? "w"}`}
              card={{
                catalogId: c.catalogId,
                name: c.name,
                game: c.game,
                set: c.set,
                number: c.number,
                imageUrl: c.imageUrl,
                cardType: c.cardType,
                condition: c.condition,
                valueCents: c.valueCents,
                state: c.state ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Dashboard view ---------------- */
async function DashboardView({ id, entityType }: { id: string; entityType: string }) {
  const agg = await getTradeAggregates(id);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="cs-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <MetricPanel title="Trade out">
          <Metric label="Average value" value={csAud(agg.out.avgCents)} />
          <Metric label="Total value" value={csAud(agg.out.totalCents)} />
          <Metric label="Average review" value={agg.reviewAvg != null ? `${agg.reviewAvg.toFixed(1)} ★` : "—"} sub="reviews coming soon" />
        </MetricPanel>
        <MetricPanel title="Trade in">
          <Metric label="Average value" value={csAud(agg.in.avgCents)} />
          <Metric label="Total value" value={csAud(agg.in.totalCents)} />
          <Metric label="Top TCG" value={gameLabel(agg.in.topGame)} />
        </MetricPanel>
        <MetricPanel title="TCG insight">
          <div style={{ marginBottom: 4 }}>
            <div className="cs-stat-label">Game mix</div>
            <GameMixBar mix={agg.gameMix} />
          </div>
          <Metric label="Entity type" value={ENTITY_LABEL[entityType as EntityType] ?? entityType} />
        </MetricPanel>
      </div>

      <section>
        <h2 className="cs-section-title" style={{ marginBottom: 12 }}>Trade log</h2>
        {agg.trades.length === 0 ? (
          <p className="cs-muted" style={{ fontSize: 13 }}>No completed trades yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {agg.trades.map((t) => <TradeRow key={t.tradeId} t={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function TradeRow({ t }: { t: ProfileTrade }) {
  return (
    <div className="cs-panel" style={{ padding: 14, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", gap: 14, alignItems: "center" }}>
      <div style={{ minWidth: 90 }}>
        <div className="cs-muted" style={{ fontSize: 11 }}>{new Date(t.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</div>
        <Link href={`/u/${t.counterpartyId}`} className="cs-link" style={{ fontSize: 13 }}>@{handleOf({ displayName: t.counterpartyName })}</Link>
      </div>
      <TradeCards label="Gave" items={t.out} total={t.outValueCents} />
      <span className="cs-muted">→</span>
      <TradeCards label="Received" items={t.in} total={t.inValueCents} />
    </div>
  );
}

function TradeCards({ label, items, total }: { label: string; items: ProfileTrade["out"]; total: number }) {
  return (
    <div>
      <div className="cs-muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
        {label} · {csAud(total)}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {items.map((c) => (
          <Link key={c.catalogId + c.condition} href={`/cards/${c.catalogId}`} style={{ width: 34 }} title={`${c.name} · ${csAud(c.valueCents)}`}>
            <CardArt src={c.imageUrl} alt={c.name} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------------- bits ---------------- */
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="cs-panel cs-stat">
      <div className="cs-stat-label">{icon} {label}</div>
      <div className="cs-stat-value">{value}</div>
    </div>
  );
}

function MetricPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cs-panel cs-stat" style={{ gap: 12 }}>
      <div className="cs-eyebrow">{title}</div>
      {children}
    </div>
  );
}

function Metric({ label, value, sub, hideIfDash }: { label: string; value: string; sub?: string; hideIfDash?: boolean }) {
  if (hideIfDash && value === "—") return null;
  return (
    <div>
      <div className="cs-stat-label">{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>{value}</div>
      {sub && <div className="cs-stat-sub">{sub}</div>}
    </div>
  );
}

function gameLabel(g: string | null): string {
  if (g === "POKEMON") return "Pokémon TCG";
  if (g === "ONE_PIECE") return "One Piece";
  return "—";
}

function GameMixChip({ mix }: { mix: GameMix }) {
  if (mix.total === 0) return <span className="cs-trust-chip cs-muted">No trades yet</span>;
  return (
    <span className="cs-trust-chip">
      Game mix <b>{mix.ONE_PIECE}% OP</b> · <b>{mix.POKEMON}% Poké</b>
    </span>
  );
}

function GameMixBar({ mix }: { mix: GameMix }) {
  if (mix.total === 0) return <p className="cs-muted" style={{ fontSize: 12 }}>No trades yet.</p>;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", boxShadow: "inset 0 0 0 1px var(--line)" }}>
        <span style={{ width: `${mix.ONE_PIECE}%`, background: "#d8453a" }} />
        <span style={{ width: `${mix.POKEMON}%`, background: "#f0b429" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginTop: 5 }}>
        <span>One Piece {mix.ONE_PIECE}%</span>
        <span>Pokémon {mix.POKEMON}%</span>
      </div>
    </div>
  );
}
