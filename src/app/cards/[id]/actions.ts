"use server";

import { revalidatePath } from "next/cache";
import { ensurePricing } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

/** Re-fetch pricing for a single catalog card (user-initiated, so we don't
 * burn the pricing API's rate limit on every page view). */
export async function refreshPriceAction(formData: FormData): Promise<void> {
  const id = String(formData.get("catalogCardId") ?? "");
  const card = await prisma.catalogCard.findUnique({ where: { id } });
  if (card) await ensurePricing(card);
  revalidatePath(`/cards/${id}`);
}
