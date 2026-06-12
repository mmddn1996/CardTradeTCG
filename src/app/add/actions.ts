"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ConditionBandSchema, GameSchema } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import {
  ensurePricing,
  findOrCreateCatalogCard,
  recordCatalogGap,
} from "@/lib/catalog";
import { getCurrentUser } from "@/lib/queries";
import { clampDeclaredValue } from "@/lib/value-rules";

export interface AddState {
  error?: string;
}

const nullable = z.string().nullish().transform((v) => v || null);

// The full provider result is passed through as a JSON `card` field.
const CardJsonSchema = z.object({
  game: GameSchema,
  externalId: z.string().min(1),
  set: z.string().min(1),
  number: z.string().min(1),
  name: z.string().min(1),
  variant: nullable,
  finish: nullable,
  imageUrl: nullable,
  description: nullable,
  rarity: nullable,
  cardType: nullable,
  cost: nullable,
  power: nullable,
  counter: nullable,
});

/** Add a looked-up card to the signed-in user's inventory (Spec §4.5). */
export async function addCardAction(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  let json: unknown;
  try {
    json = JSON.parse(String(formData.get("card") ?? "{}"));
  } catch {
    return { error: "Invalid card details." };
  }
  const parsedCard = CardJsonSchema.safeParse(json);
  const condition = ConditionBandSchema.safeParse(formData.get("condition"));
  if (!parsedCard.success || !condition.success)
    return { error: "Invalid card details." };
  const d = parsedCard.data;
  const list = formData.get("list") === "on";

  const user = await getCurrentUser();

  const card = await findOrCreateCatalogCard(d);

  const { prices } = await ensurePricing(card);
  const marketCents = prices?.[condition.data] ?? null;
  const declared = clampDeclaredValue(null, marketCents);

  const inv = await prisma.inventoryCard.create({
    data: {
      ownerId: user.id,
      catalogCardId: card.id,
      condition: condition.data,
      status: list ? "LISTED" : "VAULT",
      declaredValueCents: declared.value,
    },
  });

  if (list) {
    await prisma.listing.create({
      data: { userId: user.id, type: "HAVE", inventoryCardId: inv.id },
    });
  }

  revalidatePath("/collection");
  revalidatePath("/marketplace");
  redirect("/collection");
}

const ManualSchema = z.object({
  game: GameSchema,
  name: z.string().min(1),
  set: z.string().min(1),
  number: z.string().min(1),
  condition: ConditionBandSchema,
});

/**
 * Manual entry fallback when nothing matches (Spec §4.6): creates an unpriced
 * catalog card, files a catalog-gap for review, and adds it to the vault.
 * Unpriced cards can't be offered until priced (enforced in Stage 3).
 */
export async function manualAddAction(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  const parsed = ManualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please fill in name, set and number." };
  const d = parsed.data;

  const user = await getCurrentUser();

  const card = await findOrCreateCatalogCard({
    externalId: `manual:${randomUUID()}`,
    game: d.game,
    set: d.set,
    number: d.number,
    name: d.name,
    variant: null,
    finish: null,
    imageUrl: null,
  });

  await recordCatalogGap({
    game: d.game,
    query: `${d.name} · ${d.set} ${d.number}`,
    kind: "MANUAL",
    reportedById: user.id,
  });

  await prisma.inventoryCard.create({
    data: {
      ownerId: user.id,
      catalogCardId: card.id,
      condition: d.condition,
      status: "VAULT",
    },
  });

  revalidatePath("/collection");
  redirect("/collection");
}

/** Record that a code/search lookup found nothing (Spec §4.6). */
export async function reportGapAction(
  game: string,
  query: string,
  kind: "CODE" | "SEARCH",
): Promise<void> {
  const g = GameSchema.safeParse(game);
  if (!g.success || !query.trim()) return;
  const user = await getCurrentUser();
  await recordCatalogGap({
    game: g.data,
    query: query.trim(),
    kind,
    reportedById: user.id,
  });
}
