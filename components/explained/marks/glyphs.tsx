import type { ReactElement } from "react";
import { EX_HEX } from "../tokens";

/**
 * The glyphs of the four questions (EXPLAINED.md §3), drawn as the mockups'
 * sprite draws them. Squares answer "Is it the rule?" and are always white;
 * circles answer "How do we know?", green for Proved and Tested, rose for
 * Shown false, grey otherwise; the dashed clock answers "Since when?". Each
 * glyph is decoration: the word beside it carries the meaning.
 */
export type GlyphKind =
  | "decided"
  | "absolute"
  | "proposed"
  | "open"
  | "proved"
  | "tested"
  | "shownFalse"
  | "notGuaranteed"
  | "assumed"
  | "notYet"
  | "drift";

interface GlyphProps {
  readonly kind: GlyphKind;
  readonly className?: string;
}

const PATHS: Record<GlyphKind, ReactElement> = {
  decided: (
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill={EX_HEX.ink1} />
  ),
  absolute: (
    <>
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="1.5"
        fill={EX_HEX.ink1}
      />
      <path
        d="M6.2 8.4V7.2a1.8 1.8 0 0 1 3.6 0v1.2"
        fill="none"
        stroke={EX_HEX.panel}
        strokeWidth="1.3"
      />
      <rect
        x="5.4"
        y="8.2"
        width="5.2"
        height="3.6"
        rx=".8"
        fill={EX_HEX.panel}
      />
    </>
  ),
  proposed: (
    <rect
      x="3"
      y="3"
      width="10"
      height="10"
      rx="1.5"
      fill="none"
      stroke={EX_HEX.ink1}
      strokeWidth="1.6"
    />
  ),
  open: (
    <rect
      x="3"
      y="3"
      width="10"
      height="10"
      rx="1.5"
      fill="none"
      stroke={EX_HEX.ink3}
      strokeWidth="1.6"
      strokeDasharray="2.4 2"
    />
  ),
  proved: <circle cx="8" cy="8" r="6" fill={EX_HEX.holds} />,
  tested: (
    <>
      <circle
        cx="8"
        cy="8"
        r="5.4"
        fill="none"
        stroke={EX_HEX.holds}
        strokeWidth="1.6"
      />
      <path d="M8 2.6a5.4 5.4 0 0 1 0 10.8z" fill={EX_HEX.holds} />
    </>
  ),
  shownFalse: (
    <>
      <circle
        cx="8"
        cy="8"
        r="5.4"
        fill="none"
        stroke={EX_HEX.fails}
        strokeWidth="1.6"
      />
      <path d="M4.2 11.8l7.6-7.6" stroke={EX_HEX.fails} strokeWidth="1.6" />
    </>
  ),
  notGuaranteed: (
    <circle
      cx="8"
      cy="8"
      r="5.4"
      fill="none"
      stroke={EX_HEX.ink3}
      strokeWidth="1.6"
      strokeDasharray="2.2 2"
    />
  ),
  // Taken as given: a dashed circle with a dot at its centre, so it is not
  // read as Not guaranteed, whose circle is empty.
  assumed: (
    <>
      <circle
        cx="8"
        cy="8"
        r="5.4"
        fill="none"
        stroke={EX_HEX.ink3}
        strokeWidth="1.6"
        strokeDasharray="2.2 2"
      />
      <circle cx="8" cy="8" r="1.8" fill={EX_HEX.ink3} />
    </>
  ),
  notYet: (
    <circle
      cx="8"
      cy="8"
      r="5.4"
      fill="none"
      stroke={EX_HEX.ink4}
      strokeWidth="1.6"
    />
  ),
  drift: (
    <>
      <circle
        cx="8"
        cy="8"
        r="5.6"
        fill="none"
        stroke={EX_HEX.ink2}
        strokeWidth="1.5"
        strokeDasharray="2.2 2"
      />
      <path
        d="M8 5v3.4l2.2 1.4"
        fill="none"
        stroke={EX_HEX.ink2}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
};

export function Glyph({ kind, className = "tw-size-3.5" }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`tw-flex-none ${className}`}
      aria-hidden="true"
      focusable="false"
      data-glyph={kind}
    >
      {PATHS[kind]}
    </svg>
  );
}

/** The interface icons the kit uses: an arrow, a download, Break it, the rule. */
export type IconKind =
  | "arrow"
  | "down"
  | "break"
  | "rule"
  | "play"
  | "copy"
  | "chevron";

const ICONS: Record<IconKind, ReactElement> = {
  arrow: (
    <path
      d="M3 8h9.5M8.5 4l4 4-4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  down: (
    <path
      d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  break: (
    <path
      d="M9.5 1.8 4 9h4l-1.5 5.2L12 7H8z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  ),
  rule: (
    <path
      d="M5 4 1.8 8 5 12M11 4l3.2 4L11 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  play: <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />,
  copy: (
    <>
      <rect
        x="5"
        y="5"
        width="8"
        height="8.5"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 10.5V3.5A1.5 1.5 0 0 1 4.5 2H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </>
  ),
  chevron: (
    <path
      d="M4 6l4 4 4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  ),
};

export function Icon({
  kind,
  className = "tw-size-4",
}: {
  readonly kind: IconKind;
  readonly className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`tw-flex-none ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[kind]}
    </svg>
  );
}
