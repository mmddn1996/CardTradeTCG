import "server-only";
import type { ConditionBand } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getCardValue } from "@/lib/queries";

export interface GameMix {
  POKEMON: number;
  ONE_PIECE: number;
  total: number; // card count across in + out
}

export interface ProfileHeader {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    trustTier: string;
    ratingAvg: number | null;
    entityType: string;
  };
  cardCount: number;
  listedCount: number;
  collectionValueCents: number;
  catalogSize: number; // distinct catalog cards owned
  tradeCount: number;
  gameMix: GameMix;
}

interface TradeItem {
  catalogId: string;
  name: string;
  game: string;
  number: string;
  imageUrl: string | null;
  condition: string;
  valueCents: number;
}

export interface ProfileTrade {
  tradeId: string;
  date: Date;
  counterpartyName: string;
  counterpartyId: string;
  out: TradeItem[];
  in: TradeItem[];
  outValueCents: number;
  inValueCents: number;
}

/** All accepted trades the user took part in, with cards classified into what
 * they gave (out) and received (in) from their perspective. */
async function getUserTrades(userId: string): Promise<ProfileTrade[]> {
  const offers = await prisma.offer.findMany({
    where: {
      state: "ACCEPTED",
      OR: [{ initiatorId: userId }, { responderId: userId }],
    },
    include: {
      initiator: true,
      responder: true,
      trade: true,
      items: { include: { inventoryCard: { include: { catalogCard: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return offers
    .filter((o) => o.trade)
    .map((o) => {
      const isInitiator = o.initiatorId === userId;
      const counterparty = isInitiator ? o.responder : o.initiator;
      const out: TradeItem[] = [];
      const inn: TradeItem[] = [];
      for (const it of o.items) {
        const c = it.inventoryCard.catalogCard;
        const item: TradeItem = {
          catalogId: c.id,
          name: c.name,
          game: c.game,
          number: c.number,
          imageUrl: c.imageUrl,
          condition: it.inventoryCard.condition,
          valueCents: it.valueCents,
        };
        const mineGave =
          (isInitiator && it.side === "OFFERED") ||
          (!isInitiator && it.side === "REQUESTED");
        (mineGave ? out : inn).push(item);
      }
      return {
        tradeId: o.trade!.id,
        date: o.trade!.createdAt,
        counterpartyName: counterparty.displayName,
        counterpartyId: counterparty.id,
        out,
        in: inn,
        outValueCents: out.reduce((t, i) => t + i.valueCents, 0),
        inValueCents: inn.reduce((t, i) => t + i.valueCents, 0),
      };
    });
}

function mixOf(items: TradeItem[]): GameMix {
  let p = 0,
    o = 0;
  for (const i of items) {
    if (i.game === "POKEMON") p++;
    else if (i.game === "ONE_PIECE") o++;
  }
  const total = p + o;
  return {
    total,
    POKEMON: total ? Math.round((p / total) * 100) : 0,
    ONE_PIECE: total ? Math.round((o / total) * 100) : 0,
  };
}

export async function getProfileHeader(userId: string): Promise<ProfileHeader | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const inventory = await prisma.inventoryCard.findMany({
    where: { ownerId: userId },
    include: { catalogCard: true },
  });
  let collectionValueCents = 0;
  for (const inv of inventory) {
    const v = await getCardValue(inv.catalogCardId, inv.condition as ConditionBand);
    collectionValueCents += v?.valueCents ?? 0;
  }
  const trades = await getUserTrades(userId);
  const allItems = trades.flatMap((t) => [...t.out, ...t.in]);

  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      trustTier: user.trustTier,
      ratingAvg: user.ratingAvg,
      entityType: user.entityType,
    },
    cardCount: inventory.length,
    listedCount: inventory.filter((i) => i.status === "LISTED").length,
    collectionValueCents,
    catalogSize: new Set(inventory.map((i) => i.catalogCardId)).size,
    tradeCount: trades.length,
    gameMix: mixOf(allItems),
  };
}

export interface TradeAggregates {
  out: { count: number; totalCents: number; avgCents: number };
  in: { count: number; totalCents: number; avgCents: number; topGame: string | null };
  gameMix: GameMix;
  reviewAvg: number | null; // placeholder until reviews ship (Spec §6.1)
  trades: ProfileTrade[];
}

export async function getTradeAggregates(userId: string): Promise<TradeAggregates> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const trades = await getUserTrades(userId);
  const outItems = trades.flatMap((t) => t.out);
  const inItems = trades.flatMap((t) => t.in);
  const sum = (xs: TradeItem[]) => xs.reduce((t, i) => t + i.valueCents, 0);
  const avg = (xs: TradeItem[]) => (xs.length ? Math.round(sum(xs) / xs.length) : 0);

  const inByGame = new Map<string, number>();
  for (const i of inItems) inByGame.set(i.game, (inByGame.get(i.game) ?? 0) + 1);
  const topGame =
    [...inByGame.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    out: { count: outItems.length, totalCents: sum(outItems), avgCents: avg(outItems) },
    in: { count: inItems.length, totalCents: sum(inItems), avgCents: avg(inItems), topGame },
    gameMix: mixOf([...outItems, ...inItems]),
    reviewAvg: user?.ratingAvg ?? null,
    trades,
  };
}

export interface ProfileCard {
  catalogId: string;
  name: string;
  game: string;
  set: string;
  number: string;
  imageUrl: string | null;
  cardType: string | null;
  condition: string | null;
  valueCents: number | null;
  state?: string | null;
}

/** Inventory for a profile, filtered: have (listed) | want (wishlist) | all. */
export async function getProfileInventory(
  userId: string,
  filter: "have" | "want" | "all",
): Promise<ProfileCard[]> {
  if (filter === "want") {
    const wants = await prisma.listing.findMany({
      where: { userId, type: "WANT", catalogCard: { isNot: null } },
      include: { catalogCard: true },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(
      wants.map(async (w) => {
        const cc = w.catalogCard!;
        const v = await getCardValue(cc.id, "NM");
        return {
          catalogId: cc.id,
          name: cc.name,
          game: cc.game,
          set: cc.set,
          number: cc.number,
          imageUrl: cc.imageUrl,
          cardType: cc.cardType,
          condition: null,
          valueCents: v?.valueCents ?? null,
        };
      }),
    );
  }

  const inv = await prisma.inventoryCard.findMany({
    where: { ownerId: userId, ...(filter === "have" ? { status: "LISTED" } : {}) },
    include: { catalogCard: true },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(
    inv.map(async (i) => {
      const v = await getCardValue(i.catalogCardId, i.condition as ConditionBand);
      return {
        catalogId: i.catalogCardId,
        name: i.catalogCard.name,
        game: i.catalogCard.game,
        set: i.catalogCard.set,
        number: i.catalogCard.number,
        imageUrl: i.catalogCard.imageUrl,
        cardType: i.catalogCard.cardType,
        condition: i.condition,
        valueCents: v?.valueCents ?? null,
        state: i.status,
      };
    }),
  );
}
