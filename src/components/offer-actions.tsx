"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  acceptAction,
  cancelAction,
  rejectAction,
  type OfferActionState,
} from "@/app/offers/actions";
import { IconCheck } from "@/components/icons";

export function OfferActions({
  offerId,
  role,
}: {
  offerId: string;
  role: "responder" | "initiator";
}) {
  const [state, accept, pending] = useActionState<OfferActionState, FormData>(acceptAction, {});
  const [ack, setAck] = useState(false);
  const needsAck = state.needsOverpayConfirm;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {role === "responder" && (
          <form action={accept} style={{ display: "contents" }}>
            <input type="hidden" name="offerId" value={offerId} />
            {needsAck && <input type="hidden" name="overpayAck" value="on" />}
            <button type="submit" className="cs-btn cs-btn-primary cs-btn-lg" disabled={pending || (needsAck && !ack)}>
              {pending ? "Accepting…" : needsAck ? "Confirm & accept" : "Accept"}
            </button>
          </form>
        )}
        <Link href={`/offers/${offerId}/counter`} className="cs-btn cs-btn-lg">
          {role === "responder" ? "Counter" : "Revise"}
        </Link>
        {role === "initiator" && <FormButton offerId={offerId} action={cancelAction} label="Withdraw" />}
        <FormButton offerId={offerId} action={rejectAction} label="Reject" />
      </div>

      {needsAck && (
        <label className="cs-check" style={{ background: "var(--warn-soft)", padding: "12px 14px", borderRadius: "var(--radius)" }}>
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span className="box"><IconCheck /></span>
          {state.error}
        </label>
      )}
      {state.needsReconfirm && <p style={{ color: "var(--warn)", fontSize: 13 }}>{state.error}</p>}
      {state.error && !needsAck && !state.needsReconfirm && (
        <p style={{ color: "var(--bad)", fontSize: 13 }}>{state.error}</p>
      )}
    </div>
  );
}

function FormButton({
  offerId, action, label,
}: {
  offerId: string;
  action: (formData: FormData) => void;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="offerId" value={offerId} />
      <button type="submit" className="cs-btn cs-btn-lg">{label}</button>
    </form>
  );
}
