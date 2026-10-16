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
 *   13 units, and `TdhDiagramSwitch` shows them only in a column of 34rem
 *   (544 px) or more, so they are never scaled below 12 px.
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
  /**
   * The largest size, in CSS px; by default 1.15 times the drawing, so its
   * text stays close to the size of the prose around it.
   */
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
      style={{ maxWidth: maxWidth ?? Math.round(width * 1.15) }}
    >
      <title id={`${id}-title`}>{title}</title>
      {desc && <desc id={`${id}-desc`}>{desc}</desc>}
      {children}
    </svg>
  );
}

/**
 * The narrow drawing in a column narrower than 34rem (544 px), the wide one
 * from there: chosen by the width the diagram itself gets, not the window's,
 * so a diagram in a narrow column beside the site's navigation or a sticky
 * contents list still gets the drawing composed for its width, and the wide
 * drawing (560 units, text of 13 units or more) is never scaled below 12 px.
 */
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
    <div className={`tw-@container ${className}`}>
      <div className="@[34rem]:tw-hidden">{narrow}</div>
      <div className="tw-hidden @[34rem]:tw-block">{wide}</div>
    </div>
  );
}
