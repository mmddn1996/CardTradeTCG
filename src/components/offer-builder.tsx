"use client";

import { useActionState, useState } from "react";
import { submitOfferAction, type OfferActionState } from "@/app/offers/actions";
import { CardArt, ConditionChip, DeltaBadge } from "@/components/ui";
import { csAud, csAudShort } from "@/lib/format";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconInfo,
  IconSwap,
  IconX,
} from "@/components/icons";
import { overpayExceeds } from "@/lib/value-rules";
import type { SelectableCard } from "@/lib/offers";

export function OfferBuilder({
  responderId,
  responderHandle,
  yourCards,
  theirCards,
  initialOffered,
  initialRequested,
  parentOfferId,
}: {
  responderId: string;
  responderHandle: string;
  yourCards: SelectableCard[];
  theirCards: SelectableCard[];
  initialOffered: string[];
  initialRequested: string[];
  parentOfferId?: string;
}) {
  const [offered, setOffered] = useState(new Set(initialOffered));
  const [requested, setRequested] = useState(new Set(initialRequested));
  const [ack, setAck] = useState(false);
  const [drawer, setDrawer] = useState<null | "give" | "receive">(null);
  const [state, formAction, pending] = useActionState<OfferActionState, FormData>(submitOfferAction, {});

  const giveTotal = total(yourCards, offered);
  const receiveTotal = total(theirCards, requested);
  const overpay = overpayExceeds(giveTotal, receiveTotal);
  const canSubmit = offered.size > 0 && requested.size > 0 && (!overpay || ack) && !pending;

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, idv: string) => {
    const next = new Set(set);
    if (next.has(idv)) next.delete(idv);
    else next.add(idv);
    setter(next);
  };

  const drawerPool = drawer === "give" ? yourCards : theirCards;
  const drawerSel = drawer === "give" ? offered : requested;
  const drawerSetter = drawer === "give" ? setOffered : setRequested;

  return (
    <form action={formAction}>
      <input type="hidden" name="responderId" value={responderId} />
      {parentOfferId && <input type="hidden" name="parentOfferId" value={parentOfferId} />}
      {[...offered].map((idv) => <input key={idv} type="hidden" name="offered" value={idv} />)}
      {[...requested].map((idv) => <input key={idv} type="hidden" name="requested" value={idv} />)}

      <div className="cs-baskets">
        <Basket
          title="You give" give cards={pick(yourCards, offered)} total={giveTotal}
          onRemove={(idv) => toggle(offered, setOffered, idv)} onAdd={() => setDrawer("give")}
          addLabel="Add your cards"
        />
        <div className="cs-center-col">
          <span className="cs-swap-icon"><IconSwap /></span>
          <DeltaBadge give={giveTotal} receive={receiveTotal} />
          <div className="cs-totals-mini"><span>You give</span><b>{csAud(giveTotal)}</b></div>
          <div className="cs-totals-mini"><span>You receive</span><b>{csAud(receiveTotal)}</b></div>
        </div>
        <Basket
          title="You receive" cards={pick(theirCards, requested)} total={receiveTotal}
          onRemove={(idv) => toggle(requested, setRequested, idv)} onAdd={() => setDrawer("receive")}
          addLabel={`Add @${responderHandle}'s cards`}
        />
      </div>

      {overpay && (
        <div className="cs-overpay">
          <div className="cs-overpay-head"><IconInfo /> Heads up — you&apos;re giving more than the reference signal</div>
          <p>
            That&apos;s completely fine — collectors trade up for cards they want. You&apos;re giving
            ~{csAudShort(giveTotal)} for ~{csAudShort(receiveTotal)}. Just confirm you&apos;re happy.
          </p>
          <label className="cs-check">
            <input type="checkbox" name="overpayAck" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span className="box"><IconCheck /></span>
            Yes, I&apos;m happy with this trade
          </label>
        </div>
      )}

      {state.error && <p style={{ color: "var(--bad)", fontSize: 13, marginTop: 14 }}>{state.error}</p>}

      <div className="cs-offer-foot">
        <div className="cs-msg-field">
          <textarea name="message" placeholder="Add a note (optional)…" />
        </div>
        <div className="cs-send-col">
          <button type="submit" className="cs-btn cs-btn-primary cs-btn-lg" disabled={!canSubmit}>
            {pending ? "Sending…" : parentOfferId ? "Send counter-offer" : "Send offer"}
          </button>
          <span className="cs-muted" style={{ fontSize: 12, textAlign: "center" }}>
            They can accept, counter, or decline.
          </span>
        </div>
      </div>

      {drawer && (
        <div className="cs-drawer-back" onClick={() => setDrawer(null)}>
          <div className="cs-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cs-drawer-head">
              <strong>{drawer === "give" ? "Your cards" : `@${responderHandle}'s listings`}</strong>
              <button type="button" className="cs-iconbtn" onClick={() => setDrawer(null)}><IconX /></button>
            </div>
            <div className="cs-drawer-body">
              {drawerPool.length === 0 ? (
                <p className="cs-muted" style={{ textAlign: "center", padding: 30 }}>No eligible cards.</p>
              ) : (
                <div className="cs-drawer-grid">
                  {drawerPool.map((c) => {
                    const on = drawerSel.has(c.inventoryCardId);
                    return (
                      <div
                        key={c.inventoryCardId}
                        className={`cs-tile cs-tile-data cs-tile-click${on ? " cs-tile-selected" : ""}`}
                        onClick={() => toggle(drawerSel, drawerSetter, c.inventoryCardId)}
                      >
                        <div className="cs-tile-artwrap">
                          <CardArt src={c.imageUrl} alt={c.name} />
                          {on && <div className="cs-tile-check"><IconCheck /></div>}
                        </div>
                        <div className="cs-tile-info">
                          <div className="cs-tile-info-top">
                            <span className="cs-tile-name">{c.name}</span>
                          </div>
                          <div className="cs-tile-info-bot">
                            <ConditionChip cond={c.condition} />
                            <span className="cs-valamt" style={{ fontSize: 13, marginLeft: "auto" }}>{csAud(c.valueCents)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Basket({
  title, give, cards, total: t, onRemove, onAdd, addLabel,
}: {
  title: string; give?: boolean; cards: SelectableCard[]; total: number;
  onRemove: (id: string) => void; onAdd: () => void; addLabel: string;
}) {
  return (
    <div className={`cs-basket ${give ? "cs-basket-give" : "cs-basket-receive"}`}>
      <div className="cs-basket-head">
        <div className="cs-basket-title">
          <span className="dir">{give ? <IconArrowUp /> : <IconArrowDown />}</span>
          {title}
        </div>
        <span className="cs-basket-total">{csAud(t)}</span>
      </div>
      <div className="cs-basket-grid">
        {cards.length === 0 && <div className="cs-basket-empty">No cards yet</div>}
        {cards.map((c) => (
          <div key={c.inventoryCardId} className="cs-mini">
            <button type="button" className="cs-mini-remove" onClick={() => onRemove(c.inventoryCardId)} aria-label="Remove"><IconX /></button>
            <CardArt src={c.imageUrl} alt={c.name} />
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <ConditionChip cond={c.condition} />
              <span className="cs-valamt" style={{ fontSize: 12, marginLeft: "auto" }}>{csAud(c.valueCents)}</span>
            </div>
          </div>
        ))}
        <button type="button" className="cs-btn cs-btn-ghost cs-basket-add" onClick={onAdd}>+ {addLabel}</button>
      </div>
    </div>
  );
}

function pick(cards: SelectableCard[], sel: Set<string>): SelectableCard[] {
  return cards.filter((c) => sel.has(c.inventoryCardId));
}
function total(cards: SelectableCard[], sel: Set<string>): number {
  return cards.filter((c) => sel.has(c.inventoryCardId)).reduce((t, c) => t + c.valueCents, 0);
}
