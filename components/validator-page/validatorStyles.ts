// Class names the validator pages share, so a heading or a button looks the
// same on every page.

export const SECTION_HEADING =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50";
export const BODY = "tw-text-base tw-leading-7 tw-text-iron-300";
export const CODE =
  "tw-break-words tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.85em] tw-text-iron-100";
export const LINK =
  "tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-decoration-primary-300";
const FOCUS =
  "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950";

/** The one big button for this computer's download. */
export const PRIMARY_BUTTON = `tw-inline-flex tw-min-h-14 tw-w-full tw-items-center tw-justify-center tw-gap-2.5 tw-rounded-xl tw-bg-primary-500 tw-px-6 tw-text-lg tw-font-semibold tw-text-white tw-no-underline tw-transition hover:tw-bg-primary-600 ${FOCUS}`;

/** Every other download: the same smaller button everywhere. */
export const SECONDARY_BUTTON = `tw-inline-flex tw-min-h-9 tw-flex-none tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition hover:tw-border-primary-400/60 hover:tw-text-white ${FOCUS}`;

/** A small text button, such as "Other systems". */
export const TEXT_BUTTON = `tw-inline-flex tw-min-h-9 tw-items-center tw-gap-1 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-decoration-primary-300 ${FOCUS}`;
