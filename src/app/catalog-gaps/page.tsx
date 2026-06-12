import Link from "next/link";
import { GameChip } from "@/components/ui";
import { getCatalogGaps } from "@/lib/queries";

export const metadata = { title: "Catalog gaps — CardSwap" };

export default async function CatalogGapsPage() {
  const gaps = await getCatalogGaps();

  return (
    <div>
      <div className="cs-page-head">
        <div className="cs-eyebrow">Review queue</div>
        <h1 className="cs-h1" style={{ fontSize: 30 }}>Catalog gaps</h1>
        <p className="cs-muted" style={{ fontSize: 13, marginTop: 6 }}>
          Lookups that found no match — new promos, errors, or missing sets —
          queued for review instead of rejected.
        </p>
      </div>

      {gaps.length === 0 ? (
        <div className="cs-empty">
          <h3>No open gaps</h3>
          <p><Link href="/add" className="cs-link">Add a card →</Link></p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {gaps.map((g) => (
            <div key={g.id} className="cs-offrow">
              <GameChip game={g.game} />
              <span className="cs-offrow-main">{g.query}</span>
              <span className="cs-pill cs-pill-neutral">{g.kind}</span>
              <span className="cs-muted" style={{ fontSize: 11 }}>
                {new Date(g.createdAt).toLocaleDateString("en-AU")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
