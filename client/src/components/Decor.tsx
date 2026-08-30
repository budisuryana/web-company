/**
 * Playful Spectrum decor — flat geometric ornaments for the marketing pages.
 *
 * Every shape paints with `currentColor` or a local `--decor-*` custom property, so a
 * section sets its hues once (see the decor block in index.css) and the ornament follows.
 * All are inert: aria-hidden, pointer-events disabled via the shared `.decor` class.
 */

type DecorProps = { className?: string };

const base = (extra?: string) => `decor ${extra ?? ""}`.trim();

/** Concentric arcs rising from the baseline — a nod to the rainbow-bridge motif. */
export function RainbowArc({ className }: DecorProps) {
  return (
    <svg className={base(`decor-rainbow ${className ?? ""}`)} viewBox="0 0 200 112" aria-hidden="true" focusable="false">
      <g fill="none" strokeWidth="13" strokeLinecap="round">
        <path d="M9 106A91 91 0 0 1 191 106" stroke="var(--decor-1)" />
        <path d="M31 106A69 69 0 0 1 169 106" stroke="var(--decor-2)" />
        <path d="M53 106A47 47 0 0 1 147 106" stroke="var(--decor-3)" />
        <path d="M75 106A25 25 0 0 1 125 106" stroke="var(--decor-4)" />
      </g>
    </svg>
  );
}

/** Loose scatter of marks — plus, ring, arc, dot, tilted chip. */
export function SparkCluster({ className }: DecorProps) {
  return (
    <svg className={base(`decor-sparks ${className ?? ""}`)} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M14 6v20M4 16h20" />
        <circle cx="99" cy="28" r="7" />
        <path d="M58 98a17 17 0 0 1 32 0" />
      </g>
      <circle cx="31" cy="72" r="5" fill="currentColor" />
      <rect x="86" y="80" width="12" height="12" rx="4" fill="currentColor" transform="rotate(18 92 86)" />
    </svg>
  );
}

/** Dashed connector threading three nodes — the workflow motif, flattened. */
export function NodePath({ className }: DecorProps) {
  return (
    <svg className={base(`decor-nodes ${className ?? ""}`)} viewBox="0 0 320 90" aria-hidden="true" focusable="false">
      <path
        d="M6 74C72 74 62 16 130 16s66 58 130 58h54"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      <circle cx="6" cy="74" r="6" fill="var(--decor-1)" />
      <circle cx="130" cy="16" r="6" fill="var(--decor-2)" />
      <circle cx="260" cy="74" r="6" fill="var(--decor-3)" />
    </svg>
  );
}

/** Oversized rounded-square outline, tilted and meant to be cropped by its section. */
export function TiltFrame({ className }: DecorProps) {
  return (
    <svg className={base(`decor-frame ${className ?? ""}`)} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <rect x="14" y="14" width="172" height="172" rx="46" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Corner confetti — four unrelated shapes, four hues. */
export function ConfettiBits({ className }: DecorProps) {
  return (
    <svg className={base(`decor-confetti ${className ?? ""}`)} viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <rect x="8" y="18" width="15" height="15" rx="5" fill="var(--decor-1)" transform="rotate(-14 15 25)" />
      <circle cx="122" cy="16" r="8" fill="var(--decor-2)" />
      <path d="M58 142a19 19 0 0 1 36 0" fill="none" stroke="var(--decor-3)" strokeWidth="5" strokeLinecap="round" />
      <path d="M142 96v18M133 105h18" stroke="var(--decor-4)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
