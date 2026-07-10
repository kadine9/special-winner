import type { CSSProperties } from "react";

/**
 * A small original rainbow-arc glyph used as a decorative motif
 * throughout the "Pony Skies" theme. Plain geometric arcs — not
 * based on any show, brand, or third-party artwork.
 */
export function RainbowArc({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M4 38a28 28 0 0 1 56 0" stroke="#FF7FB4" strokeWidth="6" strokeLinecap="round" />
      <path d="M12 38a20 20 0 0 1 40 0" stroke="#FFC24B" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 38a12 12 0 0 1 24 0" stroke="#4FB6E0" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
