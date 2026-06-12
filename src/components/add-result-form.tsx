"use client";

import { useActionState } from "react";
import { CardArt, GameChip } from "@/components/ui";
import { addCardAction, type AddState } from "@/app/add/actions";
import { ConditionBandSchema } from "@/lib/enums";
import type { CatalogCardResult } from "@/lib/providers";

export function AddResultForm({ card }: { card: CatalogCardResult }) {
  const [state, formAction, pending] = useActionState<AddState, FormData>(addCardAction, {});

  return (
    <form action={formAction} className="cs-tile cs-tile-data">
      <div className="cs-tile-artwrap">
        <CardArt src={card.imageUrl} alt={card.name} />
      </div>
      <div className="cs-tile-info">
        <div className="cs-tile-info-top">
          <span className="cs-tile-name">{card.name}</span>
        </div>
        <div className="cs-tile-info-bot">
          <GameChip game={card.game} />
          <span className="cs-muted" style={{ fontSize: 11, marginLeft: "auto" }}>{card.number}</span>
        </div>
      </div>

      {/* full provider result carried through so the action needs no re-lookup */}
      <input type="hidden" name="card" value={JSON.stringify(card)} />

      <div className="cs-seg" style={{ marginTop: 2, width: "100%", justifyContent: "space-between" }}>
        {ConditionBandSchema.options.map((b, i) => (
          <label key={b} style={{ flex: 1 }}>
            <input type="radio" name="condition" value={b} defaultChecked={i === 0} style={{ display: "none" }} />
            <span className="cs-seg-opt">{b}</span>
          </label>
        ))}
      </div>

      <label className="cs-check" style={{ fontSize: 12, marginTop: 2 }}>
        <input type="checkbox" name="list" />
        <span className="box" />
        List for trade
      </label>

      {state.error && <p style={{ color: "var(--bad)", fontSize: 12 }}>{state.error}</p>}

      <button type="submit" className="cs-btn cs-btn-primary cs-btn-sm cs-btn-block" disabled={pending}>
        {pending ? "Adding…" : "Add card"}
      </button>
    </form>
  );
}
