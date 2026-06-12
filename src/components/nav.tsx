"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { switchUserAction } from "@/app/actions/session";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  IconAdd,
  IconBell,
  IconCollection,
  IconDashboard,
  IconMarket,
  IconOffers,
  IconSearch,
} from "@/components/icons";

const NAV = [
  { href: "/", label: "Dashboard", Icon: IconDashboard },
  { href: "/collection", label: "My Collection", Icon: IconCollection },
  { href: "/add", label: "Add cards", Icon: IconAdd },
  { href: "/marketplace", label: "Marketplace", Icon: IconMarket },
  { href: "/offers", label: "Offers", Icon: IconOffers },
];
const TABS = [
  { href: "/", label: "Home", Icon: IconDashboard },
  { href: "/collection", label: "Collection", Icon: IconCollection },
  { href: "/marketplace", label: "Market", Icon: IconMarket },
  { href: "/offers", label: "Offers", Icon: IconOffers },
];

export interface NavUser {
  id: string;
  displayName: string;
  trustTier: string;
}

function initials(name: string) {
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// CardSwap brand mark — two interlocking cards on a teal tile (from the brand pack).
function CardSwapMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="CardSwap" style={{ display: "block" }}>
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
  );
}

function Brand() {
  return (
    <Link href="/" className="cs-brand">
      <CardSwapMark />
      <span><b>Card</b><span className="cs-brand-sub">Swap</span></span>
    </Link>
  );
}

function DevSwitch({ users, currentUserId }: { users: NavUser[]; currentUserId: string }) {
  const current = users.find((u) => u.id === currentUserId);
  return (
    <form action={switchUserAction} className="cs-devswitch">
      <label htmlFor="cs-dev-user">Dev</label>
      <select
        id="cs-dev-user"
        name="userId"
        defaultValue={currentUserId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        title="Switch acting user (dev)"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.displayName} · {u.trustTier}</option>
        ))}
      </select>
      <span className="cs-avatar">{initials(current?.displayName ?? "?")}</span>
    </form>
  );
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
    <>
      <nav className="cs-topnav">
        <Brand />
        <div className="cs-nav-links">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={`cs-nav-link${isActive(pathname, href) ? " on" : ""}`}>
              <Icon /> {label}
              {href === "/offers" && incomingOffers > 0 && (
                <span className="cs-nav-badge">{incomingOffers}</span>
              )}
            </Link>
          ))}
        </div>
        <div className="cs-nav-right">
          <button className="cs-iconbtn" aria-label="Search"><IconSearch /></button>
          <button className="cs-iconbtn" aria-label="Notifications"><IconBell /></button>
          <ThemeSwitcher />
          <DevSwitch users={users} currentUserId={currentUserId} />
        </div>
      </nav>

      <div className="cs-mobiletop">
        <Brand />
        <div style={{ marginLeft: "auto" }}>
          <DevSwitch users={users} currentUserId={currentUserId} />
        </div>
      </div>
    </>
  );
}

export function MobileTabBar({ incomingOffers = 0 }: { incomingOffers?: number }) {
  const pathname = usePathname();
  return (
    <div className="cs-tabbar">
      <div className="cs-tabbar-inner">
        {TABS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`cs-tab${isActive(pathname, href) ? " on" : ""}`}>
            <Icon /> {label}
            {href === "/offers" && incomingOffers > 0 && (
              <span className="cs-tab-badge">{incomingOffers}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
