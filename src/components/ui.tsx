"use client";

import { useState } from "react";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconLock,
} from "@/components/icons";
import { csAudShort } from "@/lib/format";

const GAME_LABEL: Record<string, string> = {
  POKEMON: "Pokémon TCG",
  ONE_PIECE: "One Piece",
};

/* ---------- real card image in the TCG-proportioned frame ---------- */
export function CardArt({
  src,
  alt,
  game,
  flip = false,
}: {
  src?: string | null;
  alt: string;
  game?: string;
  flip?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = src && src.startsWith("http")
    ? `/api/card-image?src=${encodeURIComponent(src)}`
    : src;
  const face =
    resolved && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolved} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    ) : (
      <span className="cs-cardimg-fallback">{alt}</span>
    );

  // Plain (non-flip) — used for small thumbnails (baskets, trade log, drawer).
  if (!flip) {
    return (
      <div className="cs-cardbox">
        <div className="cs-cardimg">{face}</div>
      </div>
    );
  }

  // Flip on hover — front (the art) rotates to a CSS-only, game-tinted back.
  return (
    <div className="cs-cardbox">
      <div className="cs-card3d">
        <div className="cs-card3d-inner">
          <div className="cs-card3d-front">{face}</div>
          <CardBack game={game} />
        </div>
      </div>
    </div>
  );
}

/** Original, game-tinted card back (no card IP) carrying the CardSwap mark. */
function CardBack({ game }: { game?: string }) {
  const cls =
    game === "POKEMON" || game === "ONE_PIECE" ? `cs-cardback-${game}` : "cs-cardback-default";
  return (
    <div className={`cs-card3d-back cs-cardback ${cls}`} aria-hidden="true">
      <div className="cs-cardback-inner">
        <svg viewBox="0 0 512 512" role="img" aria-label="CardSwap">
          <rect width="512" height="512" rx="114" fill="#0FB5A8" />
          <g transform="translate(256,256)">
            <rect x="-118" y="-86" width="150" height="210" rx="22" transform="rotate(-12 -43 19)" fill="#F5F7F8" />
            <rect x="-32" y="-86" width="150" height="210" rx="22" transform="rotate(12 43 19)" fill="#FF6B5C" />
            <g strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M-44 22 L44 22 M-44 22 L-18 -4 M-44 22 L-18 48" stroke="#0FB5A8" />
              <path d="M44 -22 L-44 -22 M44 -22 L18 -48 M44 -22 L18 4" stroke="#F5F7F8" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

export function GameChip({ game }: { game: string }) {
  return <span className={`cs-chip cs-chip-game cs-game-${game}`}>{GAME_LABEL[game] ?? game}</span>;
}

export function ConditionChip({ cond }: { cond: string }) {
  return <span className={`cs-chip cs-chip-cond cs-cond-${cond}`}>{cond}</span>;
}

export function StatePill({ state }: { state: string }) {
  const map: Record<string, [string, string]> = {
    VAULT: ["In vault", "neutral"],
    LISTED: ["Listed", "good"],
    LOCKED: ["Locked", "warn"],
    PENDING: ["Pending", "info"],
    COUNTERED: ["Countered", "info"],
    ACCEPTED: ["Accepted", "good"],
    REJECTED: ["Rejected", "bad"],
    CANCELLED: ["Withdrawn", "neutral"],
    EXPIRED: ["Expired", "neutral"],
  };
  const [label, tone] = map[state] ?? [state, "neutral"];
  return <span className={`cs-pill cs-pill-${tone}`}>{label}</span>;
}

export function ValueBadge({
  valueCents,
  asOf,
  size = "sm",
}: {
  valueCents: number | null;
  asOf?: Date | null;
  size?: "sm" | "xs";
}) {
  return (
    <span className={`cs-value-badge cs-value-${size}`}>
      <span className="cs-value-amt">{csAudShort(valueCents)}</span>
      {size !== "xs" && (
        <span className="cs-value-meta">
          {valueCents == null ? "unpriced" : `ref · ${fmtDate(asOf)}`}
        </span>
      )}
    </span>
  );
}

/* delta badge — the emotional core. d = receive − give, from your view. */
export function DeltaBadge({
  give,
  receive,
  size = "md",
}: {
  give: number;
  receive: number;
  size?: "md" | "sm";
}) {
  if (give <= 0 || receive <= 0) {
    return (
      <div className={`cs-delta cs-delta-neutral cs-delta-${size}`}>
        <div className="cs-delta-top"><span className="cs-delta-dot" /><span className="cs-delta-label">Balance</span></div>
        <div className="cs-delta-amt" style={{ fontSize: 18 }}>—</div>
        <div className="cs-delta-pct">Add cards to both sides</div>
      </div>
    );
  }
  const diff = receive - give;
  const base = Math.max(give, receive, 1);
  const pct = Math.round((Math.abs(diff) / base) * 100);
  let tone: string, label: string, amt: string, sub: string;
  if (pct <= 5) {
    tone = "even"; label = "Even trade"; amt = "≈ even"; sub = "Well balanced";
  } else if (diff > 0) {
    tone = "good"; label = "In your favour"; amt = "+" + csAudShort(Math.abs(diff)); sub = `You receive ${pct}% more value`;
  } else {
    tone = "warn"; label = "You give more"; amt = "−" + csAudShort(Math.abs(diff)); sub = `You give ${pct}% more value`;
  }
  return (
    <div className={`cs-delta cs-delta-${tone} cs-delta-${size}`}>
      <div className="cs-delta-top"><span className="cs-delta-dot" /><span className="cs-delta-label">{label}</span></div>
      <div className="cs-delta-amt">{amt}</div>
      <div className="cs-delta-pct">{sub}</div>
    </div>
  );
}

export { IconCheck, IconLock, IconArrowUp, IconArrowDown };

function fmtDate(d?: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
