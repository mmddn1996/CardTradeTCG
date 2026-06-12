// Money formatting in the design's "A$" style (usable from server or client).

export function csAud(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const v = cents / 100;
  return "A$" + (v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2));
}

export function csAudShort(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const v = cents / 100;
  if (v >= 1000) return "A$" + (v / 1000).toFixed(1) + "k";
  return "A$" + (v >= 100 ? Math.round(v) : v.toFixed(2));
}
