import { PrismaClient } from "@prisma/client";
import { pricesFromNM } from "../src/lib/pricing";
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
        },
      }));

    const prices = pricesFromNM(c.valueAudNM);
    for (const [band, valueAud] of Object.entries(prices)) {
      await prisma.priceSnapshot.upsert({
        where: {
          catalogCardId_conditionBand_source: {
            catalogCardId: card.id,
            conditionBand: band,
            source: "MOCK",
          },
        },
        update: { valueAud, capturedAt: new Date() },
        create: {
          catalogCardId: card.id,
          conditionBand: band,
          valueAud,
          source: "MOCK",
        },
      });
    }
  }

  // Dev user (Stage 1 has no auth yet — Auth.js arrives in Stage 5).
  const user = await prisma.user.upsert({
    where: { email: "ash@cardswap.dev" },
    update: {},
    create: {
      displayName: "Ash K.",
      email: "ash@cardswap.dev",
      region: "AU",
      trustTier: "L2",
      kycStatus: "VERIFIED",
      completedTradeValue: 60,
      ratingAvg: 4.8,
    },
  });

  // Give the dev user some inventory + HAVE listings so the UI has content.
  const seedOwned = ["base1-4", "base1-58", "OP01-001", "OP01-120"];
  for (const externalId of seedOwned) {
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
        condition: externalId === "base1-58" ? "LP" : "NM",
        status: "LISTED",
      },
    });

    await prisma.listing.create({
      data: { userId: user.id, type: "HAVE", inventoryCardId: inv.id },
    });
  }

  const counts = {
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
