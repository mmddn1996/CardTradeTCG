import Link from "next/link";
import { DeltaBadge, StatePill } from "@/components/ui";
import { csAud } from "@/lib/format";
import { IconChevron } from "@/components/icons";
import { getCurrentUser } from "@/lib/queries";
import { listOffersForUser, type OfferSummary } from "@/lib/offers";
import { handleOf, initials } from "@/lib/display";

export const metadata = { title: "Offers — CardSwap" };

export default async function OffersPage() {
  const user = await getCurrentUser();
  const { incoming, outgoing, concluded } = await listOffersForUser(user.id);

  return (
    <div>
      <div className="cs-page-head">
        <div className="cs-eyebrow">Offers</div>
        <h1 className="cs-h1" style={{ fontSize: 30 }}>Your trades</h1>
      </div>

      <Section title={`Incoming${incoming.length ? ` · ${incoming.length}` : ""}`} rows={incoming} empty="No offers awaiting your response." />
      <Section title="Sent" rows={outgoing} empty="You haven't sent any open offers." />
      <Section title="History" rows={concluded} empty="No concluded trades yet." />
    </div>
  );
}

function Section({ title, rows, empty }: { title: string; rows: OfferSummary[]; empty: string }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 className="cs-section-title" style={{ marginBottom: 12 }}>{title}</h2>
      {rows.length === 0 ? (
        <p className="cs-muted" style={{ fontSize: 13 }}>{empty}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((o) => <OfferRow key={o.id} o={o} />)}
        </div>
      )}
    </section>
  );
}

function OfferRow({ o }: { o: OfferSummary }) {
  const incoming = o.direction === "INCOMING";
  const give = incoming ? o.requestedValueCents : o.offeredValueCents;
  const receive = incoming ? o.offeredValueCents : o.requestedValueCents;
  const giveCount = incoming ? o.requestedCount : o.offeredCount;
  const receiveCount = incoming ? o.offeredCount : o.requestedCount;
  const handle = handleOf({ displayName: o.counterpartyName });
  return (
    <Link href={`/offers/${o.id}`} className="cs-offrow">
      <span className="cs-owner-dot">{initials(o.counterpartyName)}</span>
      <div className="cs-offrow-main">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>@{handle}</strong>
          <StatePill state={o.state} />
        </div>
        <div className="cs-offrow-sub">
          {giveCount} for {receiveCount} · gives {csAud(give)} ↔ {csAud(receive)}
        </div>
      </div>
      {o.state === "PENDING" && <DeltaBadge give={give} receive={receive} size="sm" />}
      <IconChevron style={{ width: 18, height: 18, color: "var(--ink-3)" }} />
    </Link>
  );
}
