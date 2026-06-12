import Link from "next/link";
import type { ReactNode } from "react";
import { CardArt, ConditionChip, GameChip, StatePill, ValueBadge, IconLock } from "@/components/ui";

export interface TileCard {
  catalogId: string;
  name: string;
  game: string;
  set: string;
  number: string;
  imageUrl?: string | null;
  condition?: string | null;
  valueCents: number | null;
  asOf?: Date | null;
  state?: string | null; // corner pill: VAULT | LISTED | LOCKED
  softLocked?: boolean; // "in an active offer" overlay + dim
  footer?: ReactNode; // e.g. marketplace owner row
  action?: ReactNode; // e.g. Make offer button
}

export function CardTile({ card }: { card: TileCard }) {
  return (
    <div className={`cs-tile cs-tile-data${card.softLocked ? " cs-tile-dim" : ""} cs-tile-click`}>
      <div className="cs-tile-artwrap">
        <Link href={`/cards/${card.catalogId}`}>
          <CardArt src={card.imageUrl} alt={card.name} />
        </Link>
        {card.state && <div className="cs-tile-corner"><StatePill state={card.state} /></div>}
        {card.softLocked && (
          <div className="cs-tile-lock"><IconLock /> In an active offer</div>
        )}
      </div>
      <div className="cs-tile-info">
        <div className="cs-tile-info-top">
          <Link href={`/cards/${card.catalogId}`} className="cs-tile-name">
            {card.name}
          </Link>
          <ValueBadge valueCents={card.valueCents} asOf={card.asOf} size="sm" />
        </div>
        <div className="cs-tile-info-bot">
          <GameChip game={card.game} />
          {card.condition && <ConditionChip cond={card.condition} />}
          <span className="cs-muted" style={{ fontSize: 11, marginLeft: "auto" }}>
            {card.number}
          </span>
        </div>
        {card.footer}
      </div>
      {card.action && <div className="cs-tile-action">{card.action}</div>}
    </div>
  );
}
