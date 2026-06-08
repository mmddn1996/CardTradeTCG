"use client";

import { useActionState, useState } from "react";
import { submitOfferAction, type OfferActionState } from "@/app/offers/actions";
import { CardImage } from "@/components/card-image";
import { formatAud } from "@/lib/pricing";
import { overpayExceeds } from "@/lib/value-rules";
import type { SelectableCard } from "@/lib/offers";

export function OfferBuilder({
  responderId,
  responderName,
  yourCards,
  theirCards,
  initialOffered,
  initialRequested,
  parentOfferId,
}: {
  responderId: string;
  responderName: string;
  yourCards: SelectableCard[];
  theirCards: SelectableCard[];
  initialOffered: string[];
  initialRequested: string[];
  parentOfferId?: string;
}) {
  const [offered, setOffered] = useState(new Set(initialOffered));
  const [requested, setRequested] = useState(new Set(initialRequested));
  const [ack, setAck] = useState(false);
  const [state, formAction, pending] = useActionState<OfferActionState, FormData>(
    submitOfferAction,
    {},
  );

  const offeredTotal = total(yourCards, offered);
  const requestedTotal = total(theirCards, requested);
  const delta = requestedTotal - offeredTotal; // your gain: receive − give
  const overpay = overpayExceeds(offeredTotal, requestedTotal);
  const canSubmit =
    offered.size > 0 && requested.size > 0 && (!overpay || ack) && !pending;

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="responderId" value={responderId} />
      {parentOfferId && (
        <input type="hidden" name="parentOfferId" value={parentOfferId} />
      )}
      {[...offered].map((id) => (
        <input key={id} type="hidden" name="offered" value={id} />
      ))}
      {[...requested].map((id) => (
        <input key={id} type="hidden" name="requested" value={id} />
      ))}

      <div className="grid md:grid-cols-2 gap-5">
        <Basket
          title="You give"
          subtitle="Your cards"
          cards={yourCards}
          selected={offered}
          onToggle={(id) => toggle(offered, setOffered, id)}
          total={offeredTotal}
        />
        <Basket
          title="You receive"
          subtitle={`${responderName}'s listed cards`}
          cards={theirCards}
          selected={requested}
          onToggle={(id) => toggle(requested, setRequested, id)}
          total={requestedTotal}
        />
      </div>

      {/* Live value-delta badge (Spec §5.5) */}
      <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
        <div className="text-sm text-muted">
          You give <strong className="text-foreground">{formatAud(offeredTotal)}</strong>{" "}
          · receive <strong className="text-foreground">{formatAud(requestedTotal)}</strong>
        </div>
        <DeltaBadge delta={delta} />
      </div>

      {overpay && (
        <label className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <input
            type="checkbox"
            name="overpayAck"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            You&apos;re giving ~{formatAud(offeredTotal)} and receiving ~
            {formatAud(requestedTotal)} — more than 15% over. This is allowed;
            just confirm you&apos;re happy to proceed (Spec §5.5).
          </span>
        </label>
      )}

      <textarea
        name="message"
        placeholder="Add a note (optional)"
        rows={2}
        className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm"
      />

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {pending ? "Sending…" : parentOfferId ? "Send counter-offer" : "Send offer"}
      </button>
    </form>
  );
}

function Basket({
  title,
  subtitle,
  cards,
  selected,
  onToggle,
  total: t,
}: {
  title: string;
  subtitle: string;
  cards: SelectableCard[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <span className="text-sm font-semibold">{formatAud(t)}</span>
      </div>
      {cards.length === 0 ? (
        <p className="text-xs text-muted py-6 text-center">No eligible cards.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {cards.map((c) => {
            const on = selected.has(c.inventoryCardId);
            return (
              <button
                type="button"
                key={c.inventoryCardId}
                onClick={() => onToggle(c.inventoryCardId)}
                className={`text-left rounded-lg border p-1.5 transition-colors ${
                  on ? "border-accent bg-surface-2" : "border-border hover:border-accent/50"
                }`}
              >
                <CardImage src={c.imageUrl} alt={c.name} className="w-full" />
                <div className="mt-1 text-[11px] font-medium leading-tight truncate">
                  {c.name}
                </div>
                <div className="text-[10px] text-muted">
                  {c.condition} · {formatAud(c.valueCents)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DeltaBadge({ delta }: { delta: number }) {
  const even = delta === 0;
  const favourable = delta > 0;
  const cls = even
    ? "bg-surface-2 text-muted"
    : favourable
      ? "bg-positive/15 text-positive"
      : "bg-warning/15 text-warning";
  return (
    <span className={`rounded-md px-2.5 py-1 text-sm font-medium ${cls}`}>
      {even
        ? "Even"
        : `${favourable ? "+" : "−"}${formatAud(Math.abs(delta)).replace("A", "")} to you`}
    </span>
  );
}

function total(cards: SelectableCard[], selected: Set<string>): number {
  return cards
    .filter((c) => selected.has(c.inventoryCardId))
    .reduce((t, c) => t + c.valueCents, 0);
}
