export const USER_PAGE_HEADER_SURFACE_CLASS =
  "tw-border tw-border-solid !tw-border-white/10 !tw-bg-iron-950 tw-shadow-md tw-shadow-black/40";

export const USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS =
  "tw-transition-colors desktop-hover:hover:!tw-border-white/20 desktop-hover:hover:!tw-bg-iron-900";

export const USER_PAGE_HEADER_TOUCH_TARGET_CLASS =
  "[@media(any-pointer:coarse)]:tw-min-h-11 [@media(any-pointer:coarse)]:tw-min-w-11";

export const PROFILE_EDITOR_TOUCH_TARGETS_CLASS =
  "[@media(any-pointer:coarse)]:[&_button]:tw-min-h-11 [@media(any-pointer:coarse)]:[&_button]:tw-min-w-11";

// Keep 8px between controls: each visible 36px button has 4px of extra hit area.
export const PROFILE_MOBILE_ACTION_CLASS =
  "tw-relative !tw-h-9 !tw-min-h-9 !tw-rounded-lg !tw-py-0 after:tw-absolute after:-tw-inset-1 after:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
