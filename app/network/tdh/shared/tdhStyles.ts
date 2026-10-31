/** Shared class names for the TDH pages (section 4 of the plan). */
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import tableStyles from "./tdhTable.module.css";

/**
 * The frame of every TDH page. Below `md` the site's contents menu is
 * hidden, so a phone shows one TDH navigation (the section tabs), and the
 * page starts right under the site header: the H1 sits within the first
 * 200 px of a 390 px phone, app banner included.
 */
export const TDH_PAGE = `${NETWORK_REFERENCE_PAGE_CLASSES} max-md:tw-pt-1`;
export const TDH_DROPDOWN_ROW = `${NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES} max-md:tw-hidden`;
/** The header under the section tabs, above a page's H1. */
export const TDH_PAGE_HEADER_TOP = "tw-pt-2 sm:tw-pt-8";

/**
 * The TDH type scale, one for every page: H1 30 px on phones (26 px in a
 * window under 360 px) and 40 px from `sm`, the lede 16 and 18 px. Section
 * headings are 24 px (20 px under 360 px).
 */
export const TDH_H1 =
  "tw-m-0 tw-text-balance tw-break-words max-[359px]:tw-hyphens-auto tw-text-[1.625rem] tw-font-semibold tw-leading-[1.15] tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-[1.875rem] sm:tw-text-[2.5rem] sm:tw-leading-[1.1]";
export const TDH_LEDE =
  "tw-text-base tw-leading-7 tw-text-iron-200 sm:tw-text-lg sm:tw-leading-8";

export const TDH_CARD =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900";
export const TDH_FOCUS_RING =
  "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
export const TDH_LINK = `tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-text-primary-400 hover:tw-decoration-primary-400 ${TDH_FOCUS_RING}`;

/** A table frame for tables whose cells wrap to fit, so it never scrolls. */
export const TDH_TABLE_FRAME =
  "tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]";
/** Every TDH table: full width, collapsed borders, no stray pseudo-cells. */
export const TDH_TABLE = `tw-w-full tw-border-collapse tw-text-left tw-text-sm tw-leading-5 ${tableStyles["table"] ?? ""}`;
/** A table's caption: a sentence, at 13 px, never shouted in capitals. */
export const TDH_CAPTION =
  "tw-px-4 tw-py-3 tw-text-left tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-300";
export const TDH_TH =
  "tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-xs tw-font-medium tw-text-iron-400";
export const TDH_TD =
  "tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-px-4 tw-py-3 tw-align-top tw-text-iron-200";
export const TDH_TD_NUM = `${TDH_TD} tw-text-right tw-tabular-nums`;
export const TDH_TH_NUM = `${TDH_TH} tw-text-right`;

/** A table cell with tighter side padding on phones, for small tables inside cards. */
export function tdhNarrowCell(cell: string): string {
  return cell.replace("tw-px-4", "tw-px-3 sm:tw-px-4");
}

export const TDH_BUTTON = `tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;
export const TDH_CHIP_BUTTON = `tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-px-3.5 tw-text-sm tw-font-medium tw-transition-colors motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;
export const TDH_CHIP_ON =
  "tw-border-primary-400/70 tw-bg-primary-500/15 tw-text-iron-50";
export const TDH_CHIP_OFF =
  "tw-border-iron-700 tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-500 hover:tw-text-iron-100";

/**
 * Fixed series hues for diagrams (plan §4.6). 6529.io is the neutral one,
 * because it is the object under test.
 */
export const TDH_SERIES = {
  rust: {
    text: "tw-text-primary-300",
    fill: "tw-fill-primary-400",
    stroke: "tw-stroke-primary-400",
    bg: "tw-bg-primary-400",
  },
  programB: {
    text: "tw-text-violet-300",
    fill: "tw-fill-violet-400",
    stroke: "tw-stroke-violet-400",
    bg: "tw-bg-violet-400",
  },
  lean: {
    text: "tw-text-emerald-300",
    fill: "tw-fill-emerald-400",
    stroke: "tw-stroke-emerald-400",
    bg: "tw-bg-emerald-400",
  },
  python: {
    text: "tw-text-amber-200",
    fill: "tw-fill-amber-300",
    stroke: "tw-stroke-amber-300",
    bg: "tw-bg-amber-300",
  },
  live: {
    text: "tw-text-iron-300",
    fill: "tw-fill-iron-400",
    stroke: "tw-stroke-iron-400",
    bg: "tw-bg-iron-400",
  },
  memes: {
    text: "tw-text-sky-300",
    fill: "tw-fill-sky-400",
    stroke: "tw-stroke-sky-400",
    bg: "tw-bg-sky-400",
  },
  gradients: {
    text: "tw-text-fuchsia-300",
    fill: "tw-fill-fuchsia-400",
    stroke: "tw-stroke-fuchsia-400",
    bg: "tw-bg-fuchsia-400",
  },
  nextgen: {
    text: "tw-text-teal-300",
    fill: "tw-fill-teal-400",
    stroke: "tw-stroke-teal-400",
    bg: "tw-bg-teal-400",
  },
} as const;
