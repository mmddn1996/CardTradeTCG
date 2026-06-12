"use client";

import { useActionState } from "react";
import { manualAddAction, type AddState } from "@/app/add/actions";
import { CONDITION_LABEL, ConditionBandSchema } from "@/lib/enums";

export function ManualAddForm({
  game,
  defaultQuery = "",
}: {
  game: string;
  defaultQuery?: string;
}) {
  const [state, formAction, pending] = useActionState<AddState, FormData>(manualAddAction, {});

  return (
    <form action={formAction} className="cs-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, maxWidth: 560 }}>
      <div>
        <h3 className="cs-section-title" style={{ fontSize: 16 }}>Add manually</h3>
        <p className="cs-muted" style={{ fontSize: 12, marginTop: 4 }}>
          No match found. Add the card by hand — it&apos;s filed for catalog review
          and stays unpriced until a price source resolves it.
        </p>
      </div>

      <input type="hidden" name="game" value={game} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field name="name" label="Card name" defaultValue={defaultQuery} />
        <Field name="set" label="Set" />
        <Field name="number" label="Number / code" />
        <label style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", flexDirection: "column", gap: 5 }}>
          Condition
          <select name="condition" defaultValue="NM" className="cs-input">
            {ConditionBandSchema.options.map((b) => (
              <option key={b} value={b}>{b} — {CONDITION_LABEL[b]}</option>
            ))}
          </select>
        </label>
      </div>

      {state.error && <p style={{ color: "var(--bad)", fontSize: 12 }}>{state.error}</p>}

      <button type="submit" className="cs-btn cs-btn-sm" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Adding…" : "Add unpriced + report gap"}
      </button>
    </form>
  );
}

function Field({ name, label, defaultValue = "" }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", flexDirection: "column", gap: 5 }}>
      {label}
      <input name={name} defaultValue={defaultValue} className="cs-input" />
    </label>
  );
}
