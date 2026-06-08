"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { switchUserAction } from "@/app/actions/session";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/collection", label: "My Collection" },
  { href: "/add", label: "Add cards" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/offers", label: "Offers" },
];

export interface NavUser {
  id: string;
  displayName: string;
  trustTier: string;
}

export function Nav({
  users,
  currentUserId,
  incomingOffers = 0,
}: {
  users: NavUser[];
  currentUserId: string;
  incomingOffers?: number;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Card<span className="text-accent">Swap</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:text-foreground hover:bg-surface-2/60"
                }`}
              >
                {l.label}
                {l.href === "/offers" && incomingOffers > 0 && (
                  <span className="ml-1 rounded-full bg-accent-strong px-1.5 py-0.5 text-[10px] text-white">
                    {incomingOffers}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Dev-only user switcher (stand-in for auth until Stage 5). */}
        <form action={switchUserAction} className="ml-auto flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wide text-muted">
            Dev user
          </span>
          <select
            name="userId"
            defaultValue={currentUserId}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-md bg-surface-2 border border-border px-2 py-1 text-xs text-foreground"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} · {u.trustTier}
              </option>
            ))}
          </select>
        </form>
      </div>
    </header>
  );
}
