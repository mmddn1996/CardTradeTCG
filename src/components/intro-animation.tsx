"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "assemble" | "fly" | "done";

/**
 * Brand intro: the logo assembles in screen centre, then flies to the nav.
 * Plays once per session on open, and on every logo click (window event
 * "cardswap:intro"). Transform/opacity only; skipped for reduced motion.
 */
export function IntroAnimation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const heroRef = useRef<HTMLDivElement>(null);
  const [flyTransform, setFlyTransform] = useState<string>();

  const play = useCallback(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setFlyTransform(undefined);
    setPhase("assemble");
  }, []);

  // Auto-play once per session; replay on logo click.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("cs-intro") === "1";
      sessionStorage.setItem("cs-intro", "1");
    } catch {}
    // Defer out of the effect body so we don't setState synchronously on mount.
    const raf = seen ? 0 : requestAnimationFrame(() => play());
    const onTrigger = () => play();
    window.addEventListener("cardswap:intro", onTrigger);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("cardswap:intro", onTrigger);
    };
  }, [play]);

  // Drive the phase timeline.
  useEffect(() => {
    if (phase === "assemble") {
      const t = setTimeout(() => {
        // FLIP-lite: map the hero logo onto the real nav logo's position.
        const brands = Array.from(document.querySelectorAll<HTMLElement>(".cs-brand"));
        const nav = brands.find((b) => b.getBoundingClientRect().width > 0);
        const hero = heroRef.current;
        if (nav && hero) {
          const n = nav.getBoundingClientRect();
          const h = hero.getBoundingClientRect();
          const dx = n.left + n.width / 2 - (h.left + h.width / 2);
          const dy = n.top + n.height / 2 - (h.top + h.height / 2);
          const s = Math.max(0.1, n.width / h.width);
          setFlyTransform(`translate(${dx}px, ${dy}px) scale(${s})`);
        } else {
          setFlyTransform("translate(-44vw, -42vh) scale(0.22)");
        }
        setPhase("fly");
      }, 1050);
      return () => clearTimeout(t);
    }
    if (phase === "fly") {
      const t = setTimeout(() => setPhase("done"), 820);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "idle" || phase === "done") return null;

  return (
    <div className={`cs-intro${phase === "fly" ? " is-fly" : ""}`} aria-hidden="true">
      <div ref={heroRef} className="cs-intro-logo" style={flyTransform ? { transform: flyTransform } : undefined}>
        <svg className="cs-intro-mark" viewBox="0 0 512 512" aria-hidden="true">
          <rect className="cs-mk-tile" width="512" height="512" rx="114" fill="#0FB5A8" />
          <g transform="translate(256,256)">
            <g className="cs-mk-c1">
              <rect x="-118" y="-86" width="150" height="210" rx="22" transform="rotate(-12 -43 19)" fill="#F5F7F8" />
            </g>
            <g className="cs-mk-c2">
              <rect x="-32" y="-86" width="150" height="210" rx="22" transform="rotate(12 43 19)" fill="#FF6B5C" />
            </g>
            <g className="cs-mk-arrows" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M-44 22 L44 22 M-44 22 L-18 -4 M-44 22 L-18 48" stroke="#0FB5A8" />
              <path d="M44 -22 L-44 -22 M44 -22 L18 -48 M44 -22 L18 4" stroke="#F5F7F8" />
            </g>
          </g>
        </svg>
        <span className="cs-intro-word"><b>Card</b><span>Swap</span></span>
      </div>
    </div>
  );
}
