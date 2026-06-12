import Link from "next/link";
import { notFound } from "next/navigation";
import { DeltaBadge } from "@/components/ui";
import { csAud } from "@/lib/format";
import { IconCheckCircle } from "@/components/icons";
import { getCurrentUser } from "@/lib/queries";
import { getOfferDetail } from "@/lib/offers";
import { handleOf } from "@/lib/display";

export const metadata = { title: "Offer sent — CardSwap" };

export default async function OfferSentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [offer, user] = await Promise.all([getOfferDetail(id), getCurrentUser()]);
  if (!offer) notFound();

  // The sender's perspective (give = offered, receive = requested for the initiator).
  const isInitiator = user.id === offer.initiator.id;
  const give = isInitiator ? offer.offeredValueCents : offer.requestedValueCents;
  const receive = isInitiator ? offer.requestedValueCents : offer.offeredValueCents;
  const other = isInitiator ? offer.responder : offer.initiator;

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <span style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--good-soft)", color: "var(--good)" }}>
        <IconCheckCircle style={{ width: 34, height: 34 }} />
      </span>
      <div>
        <h1 className="cs-h1" style={{ fontSize: 28 }}>Offer sent to @{handleOf({ displayName: other.name })}</h1>
        <p className="cs-muted" style={{ fontSize: 14, marginTop: 8 }}>
          They can accept, counter, or decline. We&apos;ll let you know when they respond.
        </p>
      </div>

      <div className="cs-panel" style={{ padding: 20, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ textAlign: "left" }}>
          <div className="cs-totals-mini"><span>You give</span><b style={{ marginLeft: 12 }}>{csAud(give)}</b></div>
          <div className="cs-totals-mini"><span>You receive</span><b style={{ marginLeft: 12 }}>{csAud(receive)}</b></div>
        </div>
        <DeltaBadge give={give} receive={receive} size="sm" />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/offers/${id}`} className="cs-btn cs-btn-primary">View offer</Link>
        <Link href="/marketplace" className="cs-btn">Back to marketplace</Link>
        <Link href="/" className="cs-btn cs-btn-ghost">Go to dashboard</Link>
      </div>
    </div>
  );
}
