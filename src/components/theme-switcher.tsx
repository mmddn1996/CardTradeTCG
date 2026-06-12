"use client";

import { useEffect, useRef } from "react";

const THEMES = [
  ["vault", "Vault"],
  ["atelier", "Atelier"],
  ["press", "Press"],
] as const;

/** Switches the design direction by setting data-theme on <html> and persisting
 * the choice. A no-flash inline script in the root layout applies it on load. */
export function ThemeSwitcher() {
  const ref = useRef<HTMLSelectElement>(null);

  // Reflect the active theme (set pre-paint by the inline script) into the
  // control without React state, to avoid a hydration mismatch.
  useEffect(() => {
    if (ref.current) {
      ref.current.value = document.documentElement.getAttribute("data-theme") ?? "vault";
    }
  }, []);

  function apply(t: string) {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("cs-theme", t);
    } catch {}
  }

  return (
    <select
      ref={ref}
      className="cs-themeselect"
      defaultValue="vault"
      onChange={(e) => apply(e.target.value)}
      aria-label="Theme"
      title="Theme"
    >
      {THEMES.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
