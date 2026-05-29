import Link from "next/link";
import { CardImage } from "@/components/card-image";
import { ConditionBadge, GameBadge, StatusBadge } from "@/components/badges";
import { ValueBadge } from "@/components/value-badge";
import type { CardValue } from "@/lib/queries";

export interface TileCard {
  catalogId: string;
  name: string;
  set: string;
  number: string;
  game: string;
  variant?: string | null;
  finish?: string | null;
  imageUrl?: string | null;
  condition?: string;
  status?: string;
  value: CardValue | null;
  ownerName?: string;
}

export function CardTile({ card }: { card: TileCard }) {
  return (
    <Link
      href={`/cards/${card.catalogId}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-3 hover:border-accent transition-colors"
    >
      <CardImage src={card.imageUrl} alt={card.name} className="w-full" />
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <GameBadge game={card.game} />
        {card.condition && <ConditionBadge band={card.condition} />}
        {card.status && <StatusBadge status={card.status} />}
      </div>
      <div className="mt-1.5 font-medium leading-tight">{card.name}</div>
      <div className="text-xs text-muted">
        {card.set} · {card.number}
        {card.finish ? ` · ${card.finish}` : ""}
      </div>
      {card.variant && (
        <div className="text-[11px] text-accent mt-0.5">{card.variant}</div>
      )}
      <div className="mt-2 flex items-end justify-between">
        <ValueBadge value={card.value} size="sm" />
        {card.ownerName && (
          <span className="text-[11px] text-muted">{card.ownerName}</span>
        )}
      </div>
    </Link>
  );
}
