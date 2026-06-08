import Link from "next/link";
import { OfferBuilder } from "@/components/offer-builder";
import { getCurrentUser, getUserById } from "@/lib/queries";
import { getBuilderData, getInventoryOwner } from "@/lib/offers";

export const metadata = { title: "New offer — CardSwap" };

export default async function NewOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ want?: string }>;
}) {
  const { want } = await searchParams;
  const user = await getCurrentUser();

  if (!want) return <Notice>Pick a card from the Marketplace to start an offer.</Notice>;

  const target = await getInventoryOwner(want);
  if (!target) return <Notice>That card is no longer available.</Notice>;
  if (target.ownerId === user.id)
    return <Notice>You can&apos;t make an offer on your own card.</Notice>;

  const responder = await getUserById(target.ownerId);
  if (!responder) return <Notice>Card owner not found.</Notice>;

  const { yourCards, theirCards } = await getBuilderData(user.id, responder.id);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/marketplace" className="text-sm text-muted hover:text-foreground">
          ← Marketplace
        </Link>
        <h1 className="text-2xl font-semibold mt-1">
          Make an offer to {responder.displayName}
        </h1>
        <p className="text-sm text-muted">
          Pick what you&apos;ll give and what you want. Value is a reference
          signal — uneven trades are allowed.
        </p>
      </div>
      <OfferBuilder
        responderId={responder.id}
        responderName={responder.displayName}
        yourCards={yourCards}
        theirCards={theirCards}
        initialOffered={[]}
        initialRequested={[want]}
      />
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
      {children}
    </div>
  );
}
