import { PrismaClient } from "@prisma/client";
import { dollarsToCents, pricesFromNM } from "../src/lib/pricing";
import { SAMPLE_CARDS } from "../src/lib/providers/sample-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CardSwap…");

  // Catalog + price snapshots (one per condition band).
  // Prisma disallows null in a compound-unique `where`, so find-or-create by
  // the stable externalId instead of upserting on the natural key.
  for (const c of SAMPLE_CARDS) {
    const card =
      (await prisma.catalogCard.findFirst({
        where: { externalId: c.externalId },
      })) ??
      (await prisma.catalogCard.create({
        data: {
          externalId: c.externalId,
          game: c.game,
          set: c.set,
          number: c.number,
          name: c.name,
          variant: c.variant ?? null,
          finish: c.finish ?? null,
          imageUrl: c.imageUrl ?? null,
          description: c.description ?? null,
        },
      }));

    const prices = pricesFromNM(dollarsToCents(c.valueAudNM));
    for (const [band, valueCents] of Object.entries(prices)) {
      await prisma.priceSnapshot.upsert({
        where: {
          catalogCardId_conditionBand_source: {
            catalogCardId: card.id,
            conditionBand: band,
            source: "MOCK",
          },
        },
        update: { valueCents, capturedAt: new Date() },
        create: {
          catalogCardId: card.id,
          conditionBand: band,
          valueCents,
          source: "MOCK",
        },
      });
    }
  }

  // Two dev users (no auth yet — Auth.js arrives in Stage 5) so the two-sided
  // trade flows in Stage 3 can be exercised via the dev user-switcher.
  async function seedUser(data: {
    displayName: string;
    email: string;
    trustTier: string;
    completedTradeValueCents: number;
    ratingAvg: number;
    // externalId → condition; all listed HAVE so they show in the marketplace.
    owns: Record<string, "NM" | "LP" | "PL" | "PO">;
  }) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        displayName: data.displayName,
        email: data.email,
        region: "AU",
        trustTier: data.trustTier,
        kycStatus: "VERIFIED",
        completedTradeValueCents: data.completedTradeValueCents,
        ratingAvg: data.ratingAvg,
      },
    });

    for (const [externalId, condition] of Object.entries(data.owns)) {
      const catalogCard = await prisma.catalogCard.findFirst({
        where: { externalId },
      });
      if (!catalogCard) continue;
      const existing = await prisma.inventoryCard.findFirst({
        where: { ownerId: user.id, catalogCardId: catalogCard.id },
      });
      if (existing) continue;
      const inv = await prisma.inventoryCard.create({
        data: {
          ownerId: user.id,
          catalogCardId: catalogCard.id,
          condition,
          status: "LISTED",
        },
      });
      await prisma.listing.create({
        data: { userId: user.id, type: "HAVE", inventoryCardId: inv.id },
      });
    }
  }

  await seedUser({
    displayName: "Ash K.",
    email: "ash@cardswap.dev",
    trustTier: "L3",
    completedTradeValueCents: 8000,
    ratingAvg: 4.8,
    owns: {
      "base1-4": "NM", // Charizard
      "base1-58": "LP", // Pikachu
      "OP01-001": "NM", // Zoro
      "OP01-120": "NM", // Luffy alt-art
    },
  });

  await seedUser({
    displayName: "Misty W.",
    email: "misty@cardswap.dev",
    trustTier: "X1",
    completedTradeValueCents: 20000,
    ratingAvg: 4.9,
    owns: {
      "base1-2": "NM", // Blastoise
      "base1-15": "NM", // Venusaur
      "base1-10": "LP", // Mewtwo
      "base1-14": "NM", // Raichu
      "OP13-001": "NM", // Luffy leader (unpriced in live mode)
    },
  });

  const counts = {
    users: await prisma.user.count(),
    catalog: await prisma.catalogCard.count(),
    prices: await prisma.priceSnapshot.count(),
    inventory: await prisma.inventoryCard.count(),
    listings: await prisma.listing.count(),
  };
  console.log("Done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
