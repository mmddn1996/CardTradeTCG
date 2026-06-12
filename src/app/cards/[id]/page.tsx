import Link from "next/link";
import { notFound } from "next/navigation";
import { CardArt, ConditionChip, GameChip } from "@/components/ui";
import { csAud } from "@/lib/format";
import { IconArrowLeft, IconInfo } from "@/components/icons";
import { CONDITION_LABEL, type ConditionBand } from "@/lib/enums";
import { getCardCta, getCatalogCard, getCurrentUser } from "@/lib/queries";
import { handleOf, highlightKeywords } from "@/lib/display";

const BAND_ORDER: ConditionBand[] = ["NM", "LP", "PL", "PO"];

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const card = await getCatalogCard(id);
  if (!card) notFound();
  const cta = await getCardCta(card.id, user.id);

  // Single source's latest per-band value (most recent source).
  const primarySource = card.prices[0]?.source ?? null;
  const byBand = new Map<string, number>();
  for (const p of card.prices) {
    if (p.source !== primarySource) continue;
    if (!byBand.has(p.conditionBand)) byBand.set(p.conditionBand, p.valueCents);
  }
  const nm = byBand.get("NM") ?? Math.max(0, ...byBand.values());
  const asOf = card.prices[0]?.capturedAt;

  return (
    <div>
      <Link href="/collection" className="cs-btn cs-btn-ghost cs-btn-sm" style={{ marginBottom: 22 }}>
        <IconArrowLeft /> Back
      </Link>

      <div className="cs-detail">
        <div className="cs-detail-stage">
          <div className="cs-detail-card">
            <CardArt src={card.imageUrl} alt={card.name} />
          </div>
        </div>

        <div>
          <div className="cs-detail-meta">
            <GameChip game={card.game} />
            {card.finish && <span className="cs-metaitem">{card.finish}</span>}
            {cta.kind === "offer" && (
              <Link href={`/u/${cta.owner.id}`} className="cs-metaitem">@{handleOf(cta.owner)}</Link>
            )}
          </div>
          <h1 className="cs-detail-name">{card.name}</h1>
          <div className="cs-detail-meta">
            <span className="cs-metaitem"><b>{card.set}</b> · {card.number}</span>
            {card.cardType && <span className="cs-metaitem">{card.cardType}</span>}
            {card.rarity && <span className="cs-metaitem">{card.rarity}</span>}
            {card.cost && <span className="cs-metaitem">Cost <b>{card.cost}</b></span>}
            {card.power && <span className="cs-metaitem">Power <b>{card.power}</b></span>}
            {card.counter && card.counter !== "—" && <span className="cs-metaitem">Counter <b>{card.counter}</b></span>}
            {card.variant && <span className="cs-metaitem">{card.variant}</span>}
          </div>

          {card.description && (
            <div className="cs-detail-block">
              <h3>Card text</h3>
              <div className="cs-cardtext">
                {highlightKeywords(card.description).map((seg, i) =>
                  seg.kw ? <b key={i} className="kw">{seg.t}</b> : <span key={i}>{seg.t}</span>,
                )}
              </div>
            </div>
          )}

          <div className="cs-detail-block">
            <h3>Market value by condition</h3>
            <div className="cs-valtable">
              <div className="cs-valrow head">
                <span>Condition</span><span>Relative</span><span style={{ textAlign: "right" }}>Value</span>
              </div>
              {BAND_ORDER.map((band) => {
                const v = byBand.get(band) ?? null;
                const pct = v != null && nm > 0 ? Math.round((v / nm) * 100) : 0;
                return (
                  <div key={band} className={`cs-valrow${band === "NM" ? " on" : ""}`}>
                    <span className="cs-valcond">
                      <ConditionChip cond={band} />
                      <span className="cs-muted">{CONDITION_LABEL[band]}</span>
                    </span>
                    <span className="cs-valbar"><i style={{ width: `${pct}%` }} /></span>
                    <span className="cs-valamt">{v != null ? csAud(v) : "—"}</span>
                  </div>
                );
              })}
            </div>
            <div className="cs-source-line">
              <IconInfo /> Reference signal only — never required to trade. Source:{" "}
              {primarySource ?? "—"}
              {asOf ? ` · as of ${new Date(asOf).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}` : ""}
            </div>
          </div>

          {cta.kind === "offer" && (
            <Link href={`/offers/new?want=${cta.inventoryCardId}`} className="cs-btn cs-btn-primary cs-btn-lg">
              Make an offer
            </Link>
          )}
          {cta.kind === "mine" && (
            <Link href="/collection" className="cs-btn cs-btn-ghost cs-btn-lg">In your collection</Link>
          )}
          {cta.kind === "none" && (
            <Link href="/marketplace" className="cs-btn cs-btn-ghost cs-btn-lg">Browse marketplace</Link>
          )}
        </div>
      </div>
    </div>
  );
}
