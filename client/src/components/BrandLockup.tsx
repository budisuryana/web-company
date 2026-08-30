/**
 * Vector brand lockup — chevron mark + HTML wordmark.
 *
 * Replaces the raster logo: the mark inherits `currentColor` (so it flips light on the dark
 * footer with no second asset) and its notch tracks `--accent`, which each section reassigns.
 * The wordmark stays real text — selectable, sharp at any density, and a few hundred bytes.
 */

export type LockupVariant = "stack" | "line" | "duo";

/** Chevron geometry, shared with SiteShell's standalone BrandMark so the two never drift. */
export const CHEVRON_BODY = "M4 8h14l6 20 6-20h14L29 42h-10L4 8Z";
export const CHEVRON_NOTCH = "m24 28 5 14h-10l5-14Z";

/** The V with a notched base — vectorised from the original mark. */
export function BrandChevron({ className }: { className?: string }) {
  return (
    <svg className={`lockup-mark ${className ?? ""}`.trim()} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d={CHEVRON_BODY} fill="currentColor" />
      <path d={CHEVRON_NOTCH} fill="var(--accent)" />
    </svg>
  );
}

export function BrandLockup({
  name = "Ruang Karya",
  variant = "duo",
  size = "default",
  className,
}: {
  name?: string;
  variant?: LockupVariant;
  size?: "default" | "large";
  className?: string;
}) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || "Ruang";
  const rest = parts.slice(1).join(" ");

  return (
    <span className={`lockup lockup-${variant} ${size === "large" ? "is-large" : ""} ${className ?? ""}`.trim()}>
      <BrandChevron />
      {variant === "stack" ? (
        <span className="lockup-words">
          <b>{first}</b>
          {rest && <b>{rest}</b>}
        </span>
      ) : (
        <span className="lockup-words">
          <b>{first}</b>
          {rest && <b className="lockup-second">{rest}</b>}
        </span>
      )}
      {variant !== "duo" && <i className="lockup-slash" aria-hidden="true" />}
    </span>
  );
}
