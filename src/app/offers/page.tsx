import Link from "next/link";
import { DeltaBadge } from "@/components/offer-builder";
import { formatAud } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/queries";
import { listOffersForUser, type OfferSummary } from "@/lib/offers";

export const metadata = { title: "Offers — CardSwap" };

export default async function OffersPage() {
  const user = await getCurrentUser();
  const { incoming, outgoing, concluded } = await listOffersForUser(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Offers</h1>
        <p className="text-sm text-muted">
          Your trades in progress — incoming proposals, offers you&apos;ve sent,
          and past deals.
        </p>
      </div>

      <Section title="Incoming" empty="No offers awaiting your response.">
        {incoming.map((o) => (
          <OfferRow key={o.id} o={o} />
        ))}
      </Section>
      <Section title="Sent" empty="You haven't sent any open offers.">
        {outgoing.map((o) => (
          <OfferRow key={o.id} o={o} />
        ))}
      </Section>
      <Section title="History" empty="No concluded trades yet.">
        {concluded.map((o) => (
          <OfferRow key={o.id} o={o} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const has = items.some(Boolean) && items.length > 0;
  return (
    <section>
      <h2 className="font-medium mb-2">{title}</h2>
      {has ? (
        <ul className="space-y-2">{children}</ul>
      ) : (
        <p className="text-sm text-muted rounded-xl border border-dashed border-border p-4">
          {empty}
        </p>
      )}
    </section>
  );
}

function OfferRow({ o }: { o: OfferSummary }) {
  // From the viewer's perspective: incoming = they give the requested basket
  // and receive the offered one; outgoing = the reverse.
  const give = o.direction === "INCOMING" ? o.requestedValueCents : o.offeredValueCents;
  const receive = o.direction === "INCOMING" ? o.offeredValueCents : o.requestedValueCents;
  return (
    <li>
      <Link
        href={`/offers/${o.id}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent transition-colors"
      >
        <StatePill state={o.state} />
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            {o.direction === "INCOMING" ? "From" : "To"}{" "}
            <strong>{o.counterpartyName}</strong>
          </div>
          <div className="text-xs text-muted">
            give {formatAud(give)} · receive {formatAud(receive)} ·{" "}
            {o.offeredCount + o.requestedCount} cards
          </div>
        </div>
        {o.state === "PENDING" && <DeltaBadge delta={receive - give} />}
      </Link>
    </li>
  );
}

function StatePill({ state }: { state: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-accent/15 text-accent",
    COUNTERED: "bg-warning/15 text-warning",
    ACCEPTED: "bg-positive/15 text-positive",
    REJECTED: "bg-danger/15 text-danger",
    CANCELLED: "bg-surface-2 text-muted",
    EXPIRED: "bg-surface-2 text-muted",
  };
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${
        map[state] ?? "bg-surface-2 text-muted"
      }`}
    >
      {state}
    </span>
  );
}
