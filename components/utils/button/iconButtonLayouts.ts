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
  | "sidebar-rail"
  | "drop-action"
  | "drop-reaction"
  | "drop-reaction-mobile"
  | "drop-link"
  | "drop-link-fill"
  | "drop-share"
  | "drop-inline"
  | "notification-compact"
  | "notification-wide"
  | "notification-mute"
  | "notification-mute-wide"
  | "scroll-tabs"
  | "scroll-profile"
  | "scroll-filter-left"
  | "scroll-filter-right";

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
const DROP_ACTION_BASE =
  "tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const DROP_LINK_BASE =
  "tw-group tw-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-text-[0.8125rem] tw-font-medium tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200";
const NOTIFICATION_BASE =
  "tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-transition tw-duration-300 tw-ease-out aria-disabled:tw-cursor-not-allowed aria-disabled:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
const MUTE_BASE =
  "tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-text-[13px] tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed motion-reduce:tw-transition-none";
const SCROLL_FILTER_BASE =
  "tw-group tw-absolute tw-top-1/2 tw-z-20 tw-inline-flex tw-h-10 tw-w-10 tw--translate-y-1/2 tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

function getNotificationStateClasses(
  selected: boolean,
  layout: IconButtonLayout
) {
  if (layout.startsWith("notification-mute")) {
    if (selected) {
      return "tw-border-error/40 tw-bg-error/10 tw-text-error desktop-hover:hover:tw-bg-error/15 desktop-hover:hover:tw-text-error";
    }
    return layout === "notification-mute-wide"
      ? "tw-border-iron-700 tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-300"
      : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-300 enabled:desktop-hover:hover:tw-border-iron-600 enabled:desktop-hover:hover:tw-bg-iron-700";
  }
  return selected
    ? "tw-bg-primary-400/10 tw-border-primary-400/30 tw-text-primary-400 desktop-hover:hover:tw-bg-primary-400/20"
    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent tw-border-iron-700";
}

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
  "drop-action": DROP_ACTION_BASE + " desktop-hover:hover:tw-text-iron-200",
  "drop-reaction": DROP_ACTION_BASE + " desktop-hover:hover:tw-text-[#FFCC22]",
  "drop-reaction-mobile":
    "tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-transition-colors tw-duration-200 enabled:active:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
  "drop-link": DROP_LINK_BASE + " tw-size-7 tw-p-0",
  "drop-link-fill": DROP_LINK_BASE + " tw-h-full tw-w-full tw-px-0",
  "drop-share":
    "tw-flex tw-size-7 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200",
  "drop-inline":
    "tw-group tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-gap-x-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
  "notification-compact":
    NOTIFICATION_BASE +
    " " +
    COMPACT_ACTION_TOUCH_TARGET_CLASS +
    " tw-size-8 tw-p-0",
  "notification-wide":
    NOTIFICATION_BASE + " tw-h-10 tw-w-full tw-px-2.5 tw-py-2 lg:tw-h-9",
  "notification-mute":
    MUTE_BASE +
    " " +
    COMPACT_ACTION_TOUCH_TARGET_CLASS +
    " tw-size-8 tw-gap-0 tw-p-0 tw-transition-colors tw-duration-150",
  "notification-mute-wide":
    MUTE_BASE +
    " tw-h-10 tw-w-full tw-gap-2 tw-px-3 tw-transition tw-duration-300 tw-ease-out lg:tw-h-9",
  "scroll-tabs":
    "tw-group tw-absolute tw-inset-y-0 tw-z-20 tw-flex tw-w-11 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-opacity tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none",
  "scroll-profile":
    "tw-group tw-absolute tw-top-1/2 tw-z-20 tw-inline-flex tw-h-10 tw-w-8 tw--translate-y-1/2 tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400",
  "scroll-filter-left": SCROLL_FILTER_BASE + " tw-justify-start",
  "scroll-filter-right": SCROLL_FILTER_BASE + " tw-justify-end",
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
  selected = false,
  className,
}: {
  readonly layout: IconButtonLayout;
  readonly disabled?: boolean | undefined;
  readonly selected?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const notification = layout.startsWith("notification-");
  const drop = layout.startsWith("drop-");
  let disabledClasses: string | undefined;
  if (disabled && !notification && layout !== "drop-inline") {
    disabledClasses = drop
      ? "tw-cursor-default tw-opacity-50"
      : "tw-cursor-not-allowed tw-opacity-50";
  }
  return clsx(
    ROOT_CLASSES[layout],
    notification && getNotificationStateClasses(selected, layout),
    disabledClasses,
    drop &&
      !disabled &&
      layout !== "drop-reaction-mobile" &&
      "tw-cursor-pointer",
    className
  );
}

export function getIconButtonLayoutSurfaceClasses(layout: IconButtonLayout) {
  return SURFACE_CLASSES[layout];
}
