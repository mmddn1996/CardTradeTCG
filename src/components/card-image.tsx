"use client";

import { useState } from "react";

/**
 * Card artwork with a graceful fallback. Reference images come from external
 * CDNs that may be unreachable (offline dev / network policy), so we fall back
 * to a styled placeholder rather than a broken image.
 */
export function CardImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-surface-2 border border-border text-muted text-center p-2 aspect-[5/7] ${className}`}
      >
        <span className="text-xs leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-lg border border-border object-contain aspect-[5/7] bg-surface-2 ${className}`}
    />
  );
}
