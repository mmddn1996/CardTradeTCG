// Presentation helpers shared by pages (no server-only deps).

export function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

/** A short @handle derived from email local-part or display name. */
export function handleOf(user: { email?: string | null; displayName: string }): string {
  const base = user.email?.split("@")[0] ?? user.displayName;
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function initials(name: string): string {
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

/** Human-friendly trust label for the dashboard trust row (Spec §6 tiers). */
export function trustLabel(tier: string): string {
  const map: Record<string, string> = {
    BASIC: "New trader",
    L1: "Verified trader",
    L2: "Established trader",
    L3: "Trusted trader",
    X1: "Elite trader",
  };
  return map[tier] ?? tier;
}

/** Render rules text with [keyword] markup highlighted (returns segments). */
export function highlightKeywords(text: string): { t: string; kw: boolean }[] {
  const out: { t: string; kw: boolean }[] = [];
  const re = /(\[[^\]]+\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), kw: false });
    out.push({ t: m[0], kw: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), kw: false });
  return out;
}
