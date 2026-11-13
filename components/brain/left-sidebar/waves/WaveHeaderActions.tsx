import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "@/components/utils/button/compactActionButtonStyles";

const WAVE_HEADER_ACTION_BASE_CLASSES =
  "tw-group tw-inline-flex tw-cursor-pointer tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-p-0 tw-no-underline tw-transition-colors tw-duration-150 aria-[current=page]:tw-text-primary-400 aria-pressed:tw-text-primary-400 aria-expanded:tw-text-primary-400 desktop-hover:hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none";

export const WAVE_HEADER_ACTION_CLASSES = `${WAVE_HEADER_ACTION_BASE_CLASSES} ${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-size-8 touch-only:tw-size-11`;
export const WAVE_HEADER_COMPACT_ACTION_CLASSES = `${WAVE_HEADER_ACTION_BASE_CLASSES} tw-h-8 tw-w-7 @[21rem]/wave-header:tw-w-8`;

const WAVE_HEADER_ACTION_SURFACE_BASE_CLASSES =
  "tw-inline-flex tw-size-full tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-transition-colors tw-duration-150 desktop-hover:group-hover:tw-bg-iron-900 group-active:tw-bg-iron-900 motion-reduce:tw-transition-none";

export const WAVE_HEADER_ACTION_SURFACE_CLASSES = `${WAVE_HEADER_ACTION_SURFACE_BASE_CLASSES} touch-only:tw-size-10`;
export const WAVE_HEADER_COMPACT_ACTION_SURFACE_CLASSES =
  WAVE_HEADER_ACTION_SURFACE_BASE_CLASSES;

export const WAVE_HEADER_TEXT_ACTION_SURFACE_CLASSES =
  "tw-inline-flex tw-h-8 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition-colors group-focus-visible:tw-outline group-focus-visible:tw-outline-2 group-focus-visible:tw-outline-offset-2 group-focus-visible:tw-outline-primary-300 desktop-hover:group-hover:tw-bg-iron-900 desktop-hover:group-hover:tw-text-white group-active:tw-bg-iron-900 motion-reduce:tw-transition-none";
