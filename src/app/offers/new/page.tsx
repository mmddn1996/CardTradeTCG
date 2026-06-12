import Link from "next/link";
import { OfferBuilder } from "@/components/offer-builder";
import { IconArrowLeft } from "@/components/icons";
import { getCurrentUser, getUserById } from "@/lib/queries";
import { getBuilderData, getInventoryOwner } from "@/lib/offers";
import { handleOf } from "@/lib/display";

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
    <div>
      <Link href="/marketplace" className="cs-btn cs-btn-ghost cs-btn-sm" style={{ marginBottom: 18 }}>
        <IconArrowLeft /> Marketplace
      </Link>
      <div className="cs-offer-head">
        <div>
          <div className="cs-eyebrow">New offer</div>
          <h1 className="cs-h1" style={{ fontSize: 28 }}>Build your trade</h1>
        </div>
        <span className="cs-trust-chip" style={{ marginLeft: "auto" }}>with @{handleOf(responder)}</span>
      </div>
      <OfferBuilder
        responderId={responder.id}
        responderHandle={handleOf(responder)}
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
    <div className="cs-empty"><h3>{children}</h3></div>
  );
}
