import Link from "next/link";
import { notFound } from "next/navigation";
import { CardImage } from "@/components/card-image";
import { DeltaBadge } from "@/components/offer-builder";
import { OfferActions } from "@/components/offer-actions";
import { formatAud } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/queries";
import { getOfferDetail, type OfferItemView } from "@/lib/offers";
import { OVERPAY_THRESHOLD } from "@/lib/value-rules";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [offer, user] = await Promise.all([getOfferDetail(id), getCurrentUser()]);
  if (!offer) notFound();

  const isResponder = user.id === offer.responder.id;
  const isInitiator = user.id === offer.initiator.id;
  const isParticipant = isResponder || isInitiator;

  // From the viewer's perspective.
  const give = isResponder ? offer.requestedValueCents : offer.offeredValueCents;
  const receive = isResponder ? offer.offeredValueCents : offer.requestedValueCents;
  const overpaying = give > receive * (1 + OVERPAY_THRESHOLD);

  return (
    <div className="space-y-6">
      <Link href="/offers" className="text-sm text-muted hover:text-foreground">
        ← All offers
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">
          Offer {isResponder ? `from ${offer.initiator.name}` : `to ${offer.responder.name}`}
        </h1>
        <span className="rounded px-2 py-1 text-xs font-medium bg-surface-2 border border-border">
          {offer.state}
        </span>
      </div>

      {offer.parentOfferId && (
        <Link
          href={`/offers/${offer.parentOfferId}`}
          className="text-sm text-accent hover:underline"
        >
          ↩ This is a counter — view the previous offer
        </Link>
      )}

      {offer.state === "ACCEPTED" && (
        <div className="rounded-xl border border-positive/40 bg-positive/10 p-4 text-sm">
          ✓ Accepted — a trade was created and both baskets are now locked.
          Postage &amp; settlement are coming soon.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <Basket
          title={isResponder ? "You receive" : "You give"}
          owner={offer.initiator.name}
          items={offer.offered}
          total={offer.offeredValueCents}
        />
        <Basket
          title={isResponder ? "You give" : "You receive"}
          owner={offer.responder.name}
          items={offer.requested}
          total={offer.requestedValueCents}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
        <div className="text-sm text-muted">
          {isParticipant ? (
            <>You give <strong className="text-foreground">{formatAud(give)}</strong> · receive{" "}
            <strong className="text-foreground">{formatAud(receive)}</strong></>
          ) : (
            <>Offered {formatAud(offer.offeredValueCents)} · requested{" "}
            {formatAud(offer.requestedValueCents)}</>
          )}
        </div>
        {isParticipant && <DeltaBadge delta={receive - give} />}
      </div>

      {offer.message && (
        <p className="text-sm text-muted border-l-2 border-border pl-3">“{offer.message}”</p>
      )}

      {offer.state === "PENDING" && isParticipant && (
        <>
          {overpaying && (
            <p className="text-sm text-warning">
              Heads up: you&apos;d be giving more than 15% above what you receive.
              You can still proceed — you&apos;ll just confirm on accept.
            </p>
          )}
          <OfferActions offerId={offer.id} role={isResponder ? "responder" : "initiator"} />
        </>
      )}
    </div>
  );
}

function Basket({
  title,
  owner,
  items,
  total,
}: {
  title: string;
  owner: string;
  items: OfferItemView[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-muted">{owner}&apos;s cards</p>
        </div>
        <span className="text-sm font-semibold">{formatAud(total)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((c) => (
          <div key={c.inventoryCardId} className="rounded-lg border border-border p-1.5">
            <CardImage src={c.imageUrl} alt={c.name} className="w-full" />
            <div className="mt-1 text-[11px] font-medium leading-tight truncate">
              {c.name}
            </div>
            <div className="text-[10px] text-muted">
              {c.condition} · {formatAud(c.valueCents)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
