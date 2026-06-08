import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferBuilder } from "@/components/offer-builder";
import { getCurrentUser } from "@/lib/queries";
import { getBuilderData, getOfferDetail, type SelectableCard } from "@/lib/offers";

export const metadata = { title: "Counter-offer — CardSwap" };

export default async function CounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [offer, user] = await Promise.all([getOfferDetail(id), getCurrentUser()]);
  if (!offer) notFound();

  const isResponder = user.id === offer.responder.id;
  const isInitiator = user.id === offer.initiator.id;
  if (!isResponder && !isInitiator) notFound();
  if (offer.state !== "PENDING")
    return (
      <Notice>This negotiation is closed, so it can&apos;t be countered.</Notice>
    );

  // Counter from the current user's perspective: their cards become "you give".
  const strip = (i: SelectableCard & { side?: string }): SelectableCard => ({
    inventoryCardId: i.inventoryCardId,
    catalogId: i.catalogId,
    name: i.name,
    set: i.set,
    number: i.number,
    game: i.game,
    finish: i.finish,
    imageUrl: i.imageUrl,
    condition: i.condition,
    valueCents: i.valueCents,
  });

  const newResponder = isResponder ? offer.initiator : offer.responder;
  const myOfferItems = isResponder ? offer.requested : offer.offered; // my cards
  const theirOfferItems = isResponder ? offer.offered : offer.requested; // their cards

  const builder = await getBuilderData(user.id, newResponder.id);
  const yourCards = dedupe([...myOfferItems.map(strip), ...builder.yourCards]);
  const theirCards = dedupe([...theirOfferItems.map(strip), ...builder.theirCards]);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/offers/${id}`} className="text-sm text-muted hover:text-foreground">
          ← Back to offer
        </Link>
        <h1 className="text-2xl font-semibold mt-1">
          Counter to {newResponder.name}
        </h1>
        <p className="text-sm text-muted">
          Adjust either basket — add or remove cards, including pulling more of
          their listed cards (Spec §5.3).
        </p>
      </div>
      <OfferBuilder
        responderId={newResponder.id}
        responderName={newResponder.name}
        yourCards={yourCards}
        theirCards={theirCards}
        initialOffered={myOfferItems.map((i) => i.inventoryCardId)}
        initialRequested={theirOfferItems.map((i) => i.inventoryCardId)}
        parentOfferId={id}
      />
    </div>
  );
}

function dedupe(cards: SelectableCard[]): SelectableCard[] {
  const seen = new Set<string>();
  const out: SelectableCard[] = [];
  for (const c of cards) {
    if (seen.has(c.inventoryCardId)) continue;
    seen.add(c.inventoryCardId);
    out.push(c);
  }
  return out;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
      {children}
    </div>
  );
}
