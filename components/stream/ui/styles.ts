/**
 * Shared class names for the 6529 Stream section, matching the TDH explainer
 * (owner direction, 31 October 2026): iron-950 cards with a white/[0.07]
 * border, 11px uppercase labels, iron-50 semibold headings, tabular numbers,
 * and 8px (rounded-lg) buttons. No pill buttons or chips.
 */

export const STREAM_FOCUS =
  "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

export const STREAM_CARD =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950";

export const STREAM_LABEL =
  "tw-m-0 tw-text-label tw-font-medium tw-uppercase tw-text-iron-400";

export const STREAM_HEADING =
  "tw-m-0 tw-font-semibold tw-tracking-tight tw-text-iron-50";

export const STREAM_TEXT = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300";

/** One line of helper text. */
export const STREAM_HELP = "tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400";

const BUTTON_BASE = `tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-3.5 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${STREAM_FOCUS}`;

export const STREAM_BUTTON_PRIMARY = `${BUTTON_BASE} tw-border-0 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-600`;

export const STREAM_BUTTON_SECONDARY = `${BUTTON_BASE} tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-iron-100 hover:tw-bg-iron-800`;

/** A compact secondary button for dense tool rows (the dev panel). */
export const STREAM_BUTTON_SMALL = `tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-100 hover:tw-bg-iron-800 aria-pressed:tw-border-primary-400 aria-pressed:tw-bg-primary-500/20 aria-pressed:tw-text-white ${STREAM_FOCUS}`;
