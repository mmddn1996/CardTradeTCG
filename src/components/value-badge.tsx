import { formatAud } from "@/lib/pricing";
import type { CardValue } from "@/lib/queries";

/**
 * Shows a card's value with its "as of" timestamp + source (Spec §4.5).
 * An unpriced card cannot be added to an offer later (Spec §4.6), so we make
 * the unpriced state explicit here.
 */
export function ValueBadge({
  value,
  size = "md",
}: {
  value: CardValue | null;
  size?: "sm" | "md";
}) {
  if (!value) {
    return (
      <span className="inline-flex items-center rounded-md bg-surface-2 border border-border px-2 py-0.5 text-xs text-muted">
        Unpriced
      </span>
    );
  }

  const big = size === "md";
  return (
    <span className="inline-flex flex-col">
      <span className={big ? "text-lg font-semibold" : "text-sm font-semibold"}>
        {formatAud(value.valueCents)}
      </span>
      <span className="text-[10px] text-muted">
        {value.source} · as of {timeAgo(value.capturedAt)}
      </span>
    </span>
  );
}

function timeAgo(date: Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
