"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { switchUserAction } from "@/app/actions/session";
import {
  IconAdd,
  IconBell,
  IconCollection,
  IconDashboard,
  IconMarket,
  IconOffers,
  IconSearch,
  IconSwap,
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

function Brand() {
  return (
    <Link href="/" className="cs-brand">
      <span className="cs-brand-mark"><IconSwap /></span>
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
