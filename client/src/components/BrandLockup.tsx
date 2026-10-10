/**
 * Vector brand lockup — the NUSAKARYA "N" symbol + HTML wordmark.
 *
 * The symbol is an N whose diagonal is cut into three slanted blocks (nusa, islands,
 * joined into one karya). Pillars and outer blocks inherit `currentColor`, so one lockup
 * serves light and dark surfaces; the middle block is always the brand blue
 * (`--brand-accent`, lifted on dark grounds). The wordmark stays real text.
 */

export type LockupVariant = "stack" | "line" | "duo";

/** Symbol geometry on a 64-unit grid, shared with SiteShell's BrandMark and the favicon. */
export const SYMBOL_PILLARS = [
  { x: 12, y: 12, width: 10, height: 40 },
  { x: 42, y: 12, width: 10, height: 40 },
];
export const SYMBOL_BLOCKS = {
  top: "13,13 22,13 30.25,24 21.25,24",
  middle: "23.6,27 32.6,27 40.4,37.4 31.4,37.4",
  bottom: "33.75,40 42.75,40 51,51 42,51",
};

export function BrandSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {SYMBOL_PILLARS.map((pillar) => (
        <rect key={pillar.x} {...pillar} rx="2.5" fill="currentColor" />
      ))}
      <g strokeWidth="2" strokeLinejoin="round">
        <polygon points={SYMBOL_BLOCKS.top} fill="currentColor" stroke="currentColor" />
        <polygon points={SYMBOL_BLOCKS.middle} fill="var(--brand-accent)" stroke="var(--brand-accent)" />
        <polygon points={SYMBOL_BLOCKS.bottom} fill="currentColor" stroke="currentColor" />
      </g>
    </svg>
  );
}

export function BrandLockup({
  name = "NUSAKARYA",
  variant = "duo",
  size = "default",
  className,
}: {
  name?: string;
  variant?: LockupVariant;
  size?: "default" | "large";
  className?: string;
}) {
  return (
    <span className={`lockup lockup-${variant} ${size === "large" ? "is-large" : ""} ${className ?? ""}`.trim()}>
      <BrandSymbol className="lockup-mark" />
      <span className="lockup-words">
        <b>{name}</b>
      </span>
    </span>
  );
}
