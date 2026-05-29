import { CONDITION_LABEL, GAME_LABEL, type ConditionBand, type Game } from "@/lib/enums";

export function GameBadge({ game }: { game: string }) {
  const isPoke = game === "POKEMON";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
        isPoke ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"
      }`}
    >
      {GAME_LABEL[game as Game] ?? game}
    </span>
  );
}

export function ConditionBadge({ band }: { band: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface-2 border border-border text-muted">
      {band}
      <span className="sr-only"> — {CONDITION_LABEL[band as ConditionBand] ?? band}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    LISTED: "bg-positive/15 text-positive",
    VAULT: "bg-surface-2 text-muted border border-border",
    LOCKED: "bg-warning/15 text-warning",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
        map[status] ?? "bg-surface-2 text-muted"
      }`}
    >
      {status}
    </span>
  );
}
