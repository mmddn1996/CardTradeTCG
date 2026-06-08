"use client";

import { useActionState } from "react";
import { CardImage } from "@/components/card-image";
import { GameBadge } from "@/components/badges";
import { addCardAction, type AddState } from "@/app/add/actions";
import { CONDITION_LABEL, ConditionBandSchema } from "@/lib/enums";
import type { CatalogCardResult } from "@/lib/providers";

export function AddResultForm({ card }: { card: CatalogCardResult }) {
  const [state, formAction, pending] = useActionState<AddState, FormData>(
    addCardAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border bg-surface p-3 flex gap-3"
    >
      <CardImage src={card.imageUrl} alt={card.name} className="w-20 shrink-0" />

      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <GameBadge game={card.game} />
            {card.finish && (
              <span className="text-[11px] text-muted">{card.finish}</span>
            )}
          </div>
          <div className="font-medium leading-tight truncate">{card.name}</div>
          <div className="text-xs text-muted truncate">
            {card.set} · {card.number}
          </div>
          {card.variant && (
            <div className="text-[11px] text-accent">{card.variant}</div>
          )}
        </div>

        {/* Identity carried through so the action needs no second lookup. */}
        <input type="hidden" name="game" value={card.game} />
        <input type="hidden" name="externalId" value={card.externalId} />
        <input type="hidden" name="set" value={card.set} />
        <input type="hidden" name="number" value={card.number} />
        <input type="hidden" name="name" value={card.name} />
        <input type="hidden" name="variant" value={card.variant ?? ""} />
        <input type="hidden" name="finish" value={card.finish ?? ""} />
        <input type="hidden" name="imageUrl" value={card.imageUrl ?? ""} />
        <input type="hidden" name="description" value={card.description ?? ""} />

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            Condition
            <select
              name="condition"
              defaultValue="NM"
              className="block mt-0.5 rounded-md bg-surface-2 border border-border px-2 py-1 text-sm text-foreground"
            >
              {ConditionBandSchema.options.map((b) => (
                <option key={b} value={b}>
                  {b} — {CONDITION_LABEL[b]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted">
            Declared value (optional)
            <input
              name="declaredValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="market"
              className="block mt-0.5 w-28 rounded-md bg-surface-2 border border-border px-2 py-1 text-sm text-foreground"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted">
          <input name="list" type="checkbox" /> List for trade now (HAVE)
        </label>

        {state.error && (
          <p className="text-xs text-danger">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent-strong px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add to collection"}
        </button>
        <p className="text-[10px] text-muted">
          Declared value above market is capped to market.
        </p>
      </div>
    </form>
  );
}
