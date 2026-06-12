// Inline stroke icons (2px, rounded) matching the design handoff.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconDashboard = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
export const IconCollection = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4" width="13" height="16" rx="2" /><path d="M16 7l4 1.2v11L16 18" /></svg>
);
export const IconAdd = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
);
export const IconMarket = (p: P) => (
  <svg {...base} {...p}><path d="M4 8h16l-1 4H5L4 8Z" /><path d="M5 8 6 4h12l1 4" /><path d="M6 12v7h12v-7" /></svg>
);
export const IconOffers = (p: P) => (
  <svg {...base} {...p}><path d="M7 7h11l-2.2 2.2M17 17H6l2.2-2.2" /><path d="M18 7v3M6 17v-3" /></svg>
);
export const IconSwap = (p: P) => (
  <svg {...base} {...p}><path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
);
export const IconShield = (p: P) => (
  <svg {...base} {...p}><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconWallet = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="14" r="1.1" /></svg>
);
export const IconLayers = (p: P) => (
  <svg {...base} {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
);
export const IconTag = (p: P) => (
  <svg {...base} {...p}><path d="M3 11V4h7l11 11-7 7L3 11Z" /><circle cx="7.5" cy="7.5" r="1.4" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p} strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconCheckCircle = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5L16 9" /></svg>
);
export const IconChevron = (p: P) => (
  <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}><path d="M19 12H5m6-7-7 7 7 7" /></svg>
);
export const IconArrowUp = (p: P) => (
  <svg {...base} {...p}><path d="M12 19V5m-7 7 7-7 7 7" /></svg>
);
export const IconArrowDown = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14m7-7-7 7-7-7" /></svg>
);
export const IconInfo = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const IconCamera = (p: P) => (
  <svg {...base} {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3.2" /></svg>
);
export const IconLock = (p: P) => (
  <svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconStar = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z" /></svg>
);
