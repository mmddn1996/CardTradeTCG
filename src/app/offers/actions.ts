"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import {
  acceptOffer,
  cancelOffer,
  createOffer,
  rejectOffer,
} from "@/lib/trade";

export interface OfferActionState {
  error?: string;
  needsOverpayConfirm?: boolean;
  needsReconfirm?: boolean;
}

export async function submitOfferAction(
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await getCurrentUser();
  const responderId = String(formData.get("responderId") ?? "");
  const parentRaw = formData.get("parentOfferId");
  const res = await createOffer({
    initiatorId: user.id,
    responderId,
    offeredCardIds: formData.getAll("offered").map(String),
    requestedCardIds: formData.getAll("requested").map(String),
    message: String(formData.get("message") ?? "") || undefined,
    parentOfferId: parentRaw ? String(parentRaw) : undefined,
    overpayAcknowledged: formData.get("overpayAck") === "on",
  });
  if (!res.ok)
    return { error: res.error, needsOverpayConfirm: res.needsOverpayConfirm };

  revalidatePath("/offers");
  redirect(`/offers/${res.offerId}`);
}

export async function acceptAction(
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const user = await getCurrentUser();
  const res = await acceptOffer({
    offerId: String(formData.get("offerId") ?? ""),
    byUserId: user.id,
    overpayAcknowledged: formData.get("overpayAck") === "on",
  });
  if (!res.ok)
    return {
      error: res.error,
      needsOverpayConfirm: res.needsOverpayConfirm,
      needsReconfirm: res.needsReconfirm,
    };

  revalidatePath("/offers");
  revalidatePath("/collection");
  redirect(`/offers/${res.offerId}`);
}

export async function rejectAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  await rejectOffer(String(formData.get("offerId") ?? ""), user.id);
  revalidatePath("/offers");
  redirect(`/offers/${String(formData.get("offerId") ?? "")}`);
}

export async function cancelAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  await cancelOffer(String(formData.get("offerId") ?? ""), user.id);
  revalidatePath("/offers");
  redirect(`/offers/${String(formData.get("offerId") ?? "")}`);
}
