"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  acceptAction,
  cancelAction,
  rejectAction,
  type OfferActionState,
} from "@/app/offers/actions";

export function OfferActions({
  offerId,
  role,
}: {
  offerId: string;
  role: "responder" | "initiator";
}) {
  const [state, accept, pending] = useActionState<OfferActionState, FormData>(
    acceptAction,
    {},
  );
  const [ack, setAck] = useState(false);
  const needsAck = state.needsOverpayConfirm;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {role === "responder" && (
          <form action={accept} className="contents">
            <input type="hidden" name="offerId" value={offerId} />
            {needsAck && <input type="hidden" name="overpayAck" value="on" />}
            <button
              type="submit"
              disabled={pending || (needsAck && !ack)}
              className="rounded-lg bg-positive/90 text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {pending ? "Accepting…" : needsAck ? "Confirm & accept" : "Accept"}
            </button>
          </form>
        )}

        <Link
          href={`/offers/${offerId}/counter`}
          className="rounded-lg bg-surface-2 border border-border px-4 py-2 text-sm font-medium"
        >
          {role === "responder" ? "Counter" : "Revise"}
        </Link>

        {role === "initiator" && (
          <FormButton offerId={offerId} action={cancelAction} label="Withdraw" />
        )}
        <FormButton offerId={offerId} action={rejectAction} label="Reject" danger />
      </div>

      {needsAck && (
        <label className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5"
          />
          <span>{state.error}</span>
        </label>
      )}
      {state.needsReconfirm && (
        <p className="text-sm text-warning">{state.error}</p>
      )}
      {state.error && !needsAck && !state.needsReconfirm && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
    </div>
  );
}

function FormButton({
  offerId,
  action,
  label,
  danger,
}: {
  offerId: string;
  action: (formData: FormData) => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="offerId" value={offerId} />
      <button
        type="submit"
        className={`rounded-lg px-4 py-2 text-sm font-medium border ${
          danger
            ? "border-danger/40 text-danger hover:bg-danger/10"
            : "border-border bg-surface-2"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
