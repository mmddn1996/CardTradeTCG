import Link from "next/link";
import { notFound } from "next/navigation";
import { CardArt, ConditionChip, DeltaBadge, StatePill } from "@/components/ui";
import { csAud } from "@/lib/format";
import { IconArrowDown, IconArrowLeft, IconArrowUp, IconCheckCircle, IconSwap } from "@/components/icons";
import { OfferActions } from "@/components/offer-actions";
import { getCurrentUser } from "@/lib/queries";
import { getOfferDetail, type OfferItemView } from "@/lib/offers";
import { handleOf } from "@/lib/display";

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

  // "You give" / "You receive" baskets from the viewer's perspective.
  const giveBasket = isResponder ? offer.requested : offer.offered;
  const receiveBasket = isResponder ? offer.offered : offer.requested;
  const give = isResponder ? offer.requestedValueCents : offer.offeredValueCents;
  const receive = isResponder ? offer.offeredValueCents : offer.requestedValueCents;
  const counterparty = isResponder ? offer.initiator : offer.responder;

  return (
    <div>
      <Link href="/offers" className="cs-btn cs-btn-ghost cs-btn-sm" style={{ marginBottom: 18 }}>
        <IconArrowLeft /> All offers
      </Link>

      <div className="cs-offer-head">
        <div>
          <div className="cs-eyebrow">{offer.parentOfferId ? "Counter offer" : "Offer"}</div>
          <h1 className="cs-h1" style={{ fontSize: 28 }}>
            {isResponder ? "From" : "To"}{" "}
            <Link href={`/u/${counterparty.id}`} style={{ color: "var(--accent)" }}>
              @{handleOf({ displayName: counterparty.name })}
            </Link>
          </h1>
        </div>
        <StatePill state={offer.state} />
        {offer.parentOfferId && (
          <Link href={`/offers/${offer.parentOfferId}`} className="cs-link" style={{ marginLeft: "auto" }}>
            ↩ previous offer
          </Link>
        )}
      </div>

      {offer.state === "ACCEPTED" && (
        <div className="cs-banner">
          <IconCheckCircle />
          <span><b>Accepted</b> — a trade was created and both baskets are locked. Postage &amp; settlement are coming soon.</span>
        </div>
      )}

      <div className="cs-baskets">
        <Basket title="You give" give items={giveBasket} total={give} />
        <div className="cs-center-col">
          <span className="cs-swap-icon"><IconSwap /></span>
          {isParticipant && <DeltaBadge give={give} receive={receive} />}
          <div className="cs-totals-mini"><span>You give</span><b>{csAud(give)}</b></div>
          <div className="cs-totals-mini"><span>You receive</span><b>{csAud(receive)}</b></div>
        </div>
        <Basket title="You receive" items={receiveBasket} total={receive} />
      </div>

      {offer.message && (
        <p className="cs-muted" style={{ marginTop: 18, borderLeft: "2px solid var(--line)", paddingLeft: 12 }}>
          “{offer.message}”
        </p>
      )}

      {offer.state === "PENDING" && isParticipant && (
        <div style={{ marginTop: 22 }}>
          <OfferActions offerId={offer.id} role={isResponder ? "responder" : "initiator"} />
        </div>
      )}
    </div>
  );
}

function Basket({
  title,
  items,
  total,
  give,
}: {
  title: string;
  items: OfferItemView[];
  total: number;
  give?: boolean;
}) {
  return (
    <div className={`cs-basket ${give ? "cs-basket-give" : "cs-basket-receive"}`}>
      <div className="cs-basket-head">
        <div className="cs-basket-title">
          <span className="dir">{give ? <IconArrowUp /> : <IconArrowDown />}</span>
          {title}
        </div>
        <span className="cs-basket-total">{csAud(total)}</span>
      </div>
      <div className="cs-basket-grid">
        {items.length === 0 ? (
          <div className="cs-basket-empty">No cards</div>
        ) : (
          items.map((c) => (
            <div key={c.inventoryCardId}>
              <CardArt src={c.imageUrl} alt={c.name} />
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <ConditionChip cond={c.condition} />
                <span className="cs-valamt" style={{ fontSize: 13, marginLeft: "auto" }}>{csAud(c.valueCents)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
