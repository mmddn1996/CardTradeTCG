import Link from "next/link";
import { notFound } from "next/navigation";
import { CardImage } from "@/components/card-image";
import { GameBadge } from "@/components/badges";
import {
  CONDITION_LABEL,
  ConditionBandSchema,
  type ConditionBand,
} from "@/lib/enums";
import { formatAud } from "@/lib/pricing";
import { getCatalogCard } from "@/lib/queries";

const BAND_ORDER: ConditionBand[] = ["NM", "LP", "PL", "PO"];

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getCatalogCard(id);
  if (!card) notFound();

  // Show one source's prices (the most recent), so we never mix a market feed's
  // real per-condition values with the mock's derived ones.
  const primarySource = card.prices[0]?.source ?? null;
  const latestByBand = new Map<string, (typeof card.prices)[number]>();
  for (const p of card.prices) {
    if (p.source !== primarySource) continue;
    if (!latestByBand.has(p.conditionBand)) latestByBand.set(p.conditionBand, p);
  }

  return (
    <div className="space-y-6">
      <Link href="/collection" className="text-sm text-muted hover:text-foreground">
        ← Back
      </Link>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <CardImage src={card.imageUrl} alt={card.name} className="w-full" />

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <GameBadge game={card.game} />
              {card.finish && (
                <span className="text-xs text-muted">{card.finish}</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold mt-1">{card.name}</h1>
            <p className="text-muted">
              {card.set} · {card.number}
            </p>
            {card.variant && (
              <p className="text-accent text-sm mt-1">{card.variant}</p>
            )}
          </div>

          {card.description && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-medium mb-1.5">Card text</h2>
              <p className="text-sm text-muted whitespace-pre-line leading-relaxed">
                {card.description}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-2 border-b border-border text-sm font-medium">
              Market value by condition
            </div>
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-4 py-2 font-normal">Condition</th>
                  <th className="px-4 py-2 font-normal text-right">Market value</th>
                </tr>
              </thead>
              <tbody>
                {BAND_ORDER.map((band) => {
                  const snap = latestByBand.get(band);
                  return (
                    <tr key={band} className="border-t border-border/60">
                      <td className="px-4 py-2">
                        <span className="font-medium">{band}</span>{" "}
                        <span className="text-muted text-xs">
                          {CONDITION_LABEL[band]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {snap ? formatAud(snap.valueCents) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-border text-[11px] text-muted">
              Source: {primarySource ?? "—"} · Reference only — value never gates
              a trade.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep the band vocabulary validated against the schema at module load.
ConditionBandSchema.options.forEach((b) => {
  if (!BAND_ORDER.includes(b)) throw new Error(`Unhandled condition band: ${b}`);
});
