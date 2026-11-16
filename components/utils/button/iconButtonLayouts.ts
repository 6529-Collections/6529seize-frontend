import clsx from "clsx";

import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "./compactActionButtonStyles";

// Responsive presets own both the hit target and its visible surface so callers
// can share a layout without overriding its dimensions locally.
export type IconButtonLayout =
  | "toolbar"
  | "toolbar-compact"
  | "toolbar-filled"
  | "sidebar-search"
  | "pin"
  | "pin-compact"
  | "pin-reveal"
  | "back"
  | "back-compact"
  | "sidebar-edge"
  | "sidebar-rail";

const TOOLBAR_BASE =
  "tw-group tw-inline-flex tw-cursor-pointer tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-p-0 tw-no-underline tw-transition-colors tw-duration-150 aria-[current=page]:tw-text-primary-400 aria-pressed:tw-text-primary-400 aria-expanded:tw-text-primary-400 desktop-hover:hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none";
const TOOLBAR_TARGET =
  TOOLBAR_BASE +
  " " +
  COMPACT_ACTION_TOUCH_TARGET_CLASS +
  " tw-size-8 touch-only:tw-size-11";
const PIN_BASE =
  "tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400";
const BACK_BASE =
  "tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50";
const SURFACE_BASE =
  "tw-inline-flex tw-size-full tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none";
const TOOLBAR_SURFACE =
  SURFACE_BASE +
  " tw-bg-transparent desktop-hover:group-hover:tw-bg-iron-900 group-active:tw-bg-iron-900";

const ROOT_CLASSES: Record<IconButtonLayout, string> = {
  toolbar: TOOLBAR_TARGET,
  "toolbar-filled": TOOLBAR_TARGET,
  "toolbar-compact":
    TOOLBAR_BASE + " tw-h-8 tw-w-7 @[21rem]/wave-header:tw-w-8",
  "sidebar-search":
    TOOLBAR_BASE +
    " " +
    COMPACT_ACTION_TOUCH_TARGET_CLASS +
    " tw-size-9 touch-only:tw-size-11",
  pin: PIN_BASE + " tw-size-7 sm:tw-size-6",
  "pin-compact": PIN_BASE + " tw-size-7",
  "pin-reveal":
    PIN_BASE +
    " tw-h-7 tw-w-0 desktop-hover:group-hover:tw-w-7 focus-visible:tw-w-7 touch-only:tw-w-7",
  back:
    BACK_BASE +
    " tw-size-11 tw-self-start sm:-tw-ml-2.5 sm:desktop-hover:tw-h-9",
  "back-compact":
    BACK_BASE +
    " " +
    COMPACT_ACTION_TOUCH_TARGET_CLASS +
    " tw-h-8 tw-w-6 @[21rem]/wave-header:tw-w-8",
  "sidebar-edge":
    "tw-group tw-flex tw-size-8 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-r-0 tw-border-solid tw-border-white/[0.08] tw-bg-iron-700 tw-shadow-md tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/[0.16] desktop-hover:hover:tw-bg-iron-600 motion-reduce:tw-transition-none",
  "sidebar-rail":
    "tw-group/sidebar-toggle tw-absolute tw-right-0 tw-top-1/2 tw-z-20 tw-flex tw-h-[52px] tw-w-5 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-opacity-0 tw-transition-opacity tw-duration-150 group-hover/sidebar:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 touch-only:tw-opacity-100 motion-reduce:tw-transition-none",
};

const SURFACE_CLASSES: Partial<Record<IconButtonLayout, string>> = {
  toolbar: TOOLBAR_SURFACE + " touch-only:tw-size-10",
  "toolbar-compact": TOOLBAR_SURFACE,
  "sidebar-search": TOOLBAR_SURFACE + " touch-only:tw-size-10",
  "toolbar-filled":
    SURFACE_BASE +
    " tw-bg-iron-900 desktop-hover:group-hover:tw-bg-iron-800 touch-only:tw-size-10",
};

export function getIconButtonLayoutClasses({
  layout,
  disabled,
  className,
}: {
  readonly layout: IconButtonLayout;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  return clsx(
    ROOT_CLASSES[layout],
    disabled && "tw-cursor-not-allowed tw-opacity-50",
    className
  );
}

export function getIconButtonLayoutSurfaceClasses(layout: IconButtonLayout) {
  return SURFACE_CLASSES[layout];
}
