import clsx from "clsx";

export type UnderlineTabSize = "default" | "sm";

const SIZE_CLASSES: Record<UnderlineTabSize, string> = {
  default: "tw-text-base",
  sm: "tw-text-sm",
};

export const UNDERLINE_TAB_INDICATOR_CLASSES =
  "tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-h-0.5 tw-w-px tw-origin-left tw-bg-primary-400 tw-transition-[transform,opacity] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none";

export const UNDERLINE_TAB_TEXT_INDICATOR_CLASSES =
  "after:tw-absolute after:tw-inset-x-0 after:-tw-bottom-px after:tw-h-0.5 after:tw-bg-primary-400 after:tw-content-['']";

// Preferences uses cards on narrow containers and underline navigation on wider
// ones. Keep that responsive presentation while sharing the Profile tab states.
export function getPreferencesUnderlineTabClasses(active: boolean) {
  return clsx(
    "@[42rem]/preferences:tw-font-medium",
    active
      ? "tw-bg-primary-500/10 tw-text-primary-300 @[42rem]/preferences:tw-border-primary-400 @[42rem]/preferences:tw-bg-transparent @[42rem]/preferences:tw-text-iron-100"
      : "tw-text-iron-300 @[42rem]/preferences:tw-border-transparent @[42rem]/preferences:tw-text-iron-400 desktop-hover:hover:tw-text-iron-50"
  );
}

export function getUnderlineTabTextClasses(active: boolean) {
  return active
    ? "tw-text-iron-100"
    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-50";
}

// Layout stays with the caller so existing target sizes and responsive navigation
// do not change when adopting the shared appearance.
export function getUnderlineTabClasses({
  active,
  size,
  externalIndicator = false,
}: {
  readonly active: boolean;
  readonly size?: UnderlineTabSize | undefined;
  readonly externalIndicator?: boolean | undefined;
}) {
  return clsx(
    "tw-relative tw-whitespace-nowrap tw-rounded-none tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-font-medium tw-no-underline tw-transition-colors tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none",
    size && SIZE_CLASSES[size],
    getUnderlineTabTextClasses(active),
    active && !externalIndicator
      ? "tw-border-primary-400"
      : "tw-border-transparent"
  );
}
