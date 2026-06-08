import Link from "next/link";
import { GameBadge } from "@/components/badges";
import { getCatalogGaps } from "@/lib/queries";

export const metadata = { title: "Catalog gaps — CardSwap" };

export default async function CatalogGapsPage() {
  const gaps = await getCatalogGaps();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Catalog gaps</h1>
        <p className="text-sm text-muted">
          Lookups that found no match — new promos, errors, or missing sets —
          queued for review instead of rejected.
        </p>
      </div>

      {gaps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
          No open gaps.{" "}
          <Link href="/add" className="text-accent hover:underline">
            Add a card
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {gaps.map((g) => (
            <li
              key={g.id}
              className="rounded-lg border border-border bg-surface px-3 py-2 flex items-center gap-3"
            >
              <GameBadge game={g.game} />
              <span className="flex-1 text-sm">{g.query}</span>
              <span className="text-[10px] rounded bg-surface-2 border border-border px-1.5 py-0.5 text-muted">
                {g.kind}
              </span>
              <span className="text-[11px] text-muted">
                {new Date(g.createdAt).toLocaleDateString("en-AU")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
