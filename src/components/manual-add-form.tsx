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
  const [state, formAction, pending] = useActionState<AddState, FormData>(
    manualAddAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-dashed border-border bg-surface p-4 space-y-3"
    >
      <div>
        <h3 className="font-medium">Add manually</h3>
        <p className="text-xs text-muted">
          No match found. Add the card by hand — it&apos;s filed for catalog review
          and stays unpriced until a price source resolves it.
        </p>
      </div>

      <input type="hidden" name="game" value={game} />

      <div className="grid sm:grid-cols-2 gap-2">
        <Field name="name" label="Card name" defaultValue={defaultQuery} />
        <Field name="set" label="Set" />
        <Field name="number" label="Number / code" />
        <label className="text-xs text-muted">
          Condition
          <select
            name="condition"
            defaultValue="NM"
            className="block mt-0.5 w-full rounded-md bg-surface-2 border border-border px-2 py-1.5 text-sm text-foreground"
          >
            {ConditionBandSchema.options.map((b) => (
              <option key={b} value={b}>
                {b} — {CONDITION_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error && <p className="text-xs text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add unpriced + report gap"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="block mt-0.5 w-full rounded-md bg-surface-2 border border-border px-2 py-1.5 text-sm text-foreground"
      />
    </label>
  );
}
