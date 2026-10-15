/** Shared class names for the TDH pages (section 4 of the plan). */

export const TDH_PROSE = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300";
export const TDH_PROSE_LARGE =
  "tw-m-0 tw-text-base tw-leading-7 tw-text-iron-200";
export const TDH_PROSE_MAX = "tw-max-w-3xl";
export const TDH_H3 =
  "tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100";
export const TDH_CARD =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900";
export const TDH_CARD_SOFT =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50";
export const TDH_FOCUS_RING =
  "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
export const TDH_LINK = `tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-text-primary-400 hover:tw-decoration-primary-400 ${TDH_FOCUS_RING}`;
/** A link that stands alone, outside a sentence: it keeps a 44 px target. */
export const TDH_LINK_STANDALONE = `${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center`;
export const TDH_MONO = "tw-font-mono tw-text-[13px] tw-leading-6";
export const TDH_NUM = "tw-tabular-nums";

/** A table frame that scrolls sideways: pair it with tabIndex 0, role region and a label. */
export const TDH_TABLE_WRAP =
  "tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]";
/** A table frame for tables whose cells wrap to fit, so it never scrolls. */
export const TDH_TABLE_FRAME =
  "tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]";
export const TDH_TABLE =
  "tw-w-full tw-border-collapse tw-text-left tw-text-sm tw-leading-5";
export const TDH_CAPTION =
  "tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
export const TDH_TH =
  "tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-xs tw-font-medium tw-text-iron-400";
export const TDH_TD =
  "tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-px-4 tw-py-3 tw-align-top tw-text-iron-200";
/** A cell that stacks as a block on phones and becomes a bordered table cell from md (or lg). */
export const TDH_TD_STACK_MD =
  "tw-border-0 tw-p-0 tw-align-top tw-text-iron-200 md:tw-border-b md:tw-border-solid md:tw-border-white/[0.05] md:tw-px-4 md:tw-py-3";
export const TDH_TD_STACK_LG =
  "tw-border-0 tw-p-0 tw-align-top tw-text-iron-200 lg:tw-border-b lg:tw-border-solid lg:tw-border-white/[0.05] lg:tw-px-4 lg:tw-py-3";
export const TDH_TD_NUM = `${TDH_TD} tw-text-right tw-tabular-nums`;
export const TDH_TH_NUM = `${TDH_TH} tw-text-right`;

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
