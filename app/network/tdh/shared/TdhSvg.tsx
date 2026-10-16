import type { ReactNode } from "react";

/**
 * Diagrams on the TDH pages are drawn twice, phone first: a narrow layout
 * below `md` and a wide one from `md`, each composed for its width rather
 * than one drawing scaled to fit. Text stays at least 12 px on screen:
 *
 * - narrow drawings are at most `NARROW_WIDTH` units wide with text of at
 *   least 14 units, so they keep 12 px down to a 245 px column (a 390 px
 *   window beside the site's navigation, inside a card);
 * - wide drawings are at most `WIDE_WIDTH` units wide with text of at least
 *   13 units, and the narrowest column they are shown in from `md` is about
 *   570 px, so they are never scaled below their own size.
 *
 * `scripts/tdh-pages-check.mjs` measures every SVG text on screen and fails
 * below 12 px.
 */
export const NARROW_WIDTH = 280;
export const WIDE_WIDTH = 560;

export function TdhSvg({
  id,
  width,
  height,
  title,
  desc,
  maxWidth,
  className = "",
  children,
}: {
  /** Unique on the page: names the title and description. */
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly desc?: string;
  /** The largest size, in CSS px; by default 1.4 times the drawing. */
  readonly maxWidth?: number;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-labelledby={desc ? `${id}-title ${id}-desc` : `${id}-title`}
      className={`tw-block tw-h-auto ${className}`}
      style={{ maxWidth: maxWidth ?? Math.round(width * 1.4) }}
    >
      <title id={`${id}-title`}>{title}</title>
      {desc && <desc id={`${id}-desc`}>{desc}</desc>}
      {children}
    </svg>
  );
}

/** The narrow drawing below `md`, the wide one from `md`. */
export function TdhDiagramSwitch({
  narrow,
  wide,
  className = "",
}: {
  readonly narrow: ReactNode;
  readonly wide: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <div className="md:tw-hidden">{narrow}</div>
      <div className="tw-hidden md:tw-block">{wide}</div>
    </div>
  );
}
