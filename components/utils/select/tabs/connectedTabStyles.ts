import clsx from "clsx";

export type CommonTabsActiveTone = "neutral" | "primary";
export type ConnectedTabSize = "xs" | "sm" | "md";
export type ConnectedTabTypography = "default" | "body";
export type ConnectedTabSpacing = "default" | "compact-mobile";
type ConnectedTabPresentation = "label" | "icon" | "sidebar";

export const CONNECTED_TAB_SURFACE_CLASSES =
  "tw-rounded-lg tw-border-white/[0.06] tw-bg-iron-950/75 tw-ring-white/[0.06]";

export const CONNECTED_TAB_LIST_CLASSES = `${CONNECTED_TAB_SURFACE_CLASSES} tw-gap-0.5 tw-border tw-border-solid tw-p-0.5`;

export const CONNECTED_TAB_INTERACTION_CLASSES =
  "tw-cursor-pointer tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none";

export function getConnectedTabStateClasses({
  isActive,
  activeTone = "neutral",
}: {
  readonly isActive: boolean;
  readonly activeTone?: CommonTabsActiveTone;
}) {
  const activeClasses =
    activeTone === "primary"
      ? "tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-600"
      : "tw-bg-iron-800 tw-text-iron-100 desktop-hover:hover:tw-bg-white/[0.14]";

  return isActive
    ? `${activeClasses} tw-ring-1 tw-ring-inset tw-ring-white/5`
    : "tw-bg-transparent tw-text-iron-400 active:tw-bg-iron-900 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100";
}

export function getConnectedTabButtonClasses({
  isActive,
  fill = false,
  activeTone = "neutral",
  size = "md",
  typography = "default",
  spacing = "default",
  presentation = "label",
}: {
  readonly isActive: boolean;
  readonly fill?: boolean;
  readonly activeTone?: CommonTabsActiveTone;
  readonly size?: ConnectedTabSize;
  readonly typography?: ConnectedTabTypography;
  readonly spacing?: ConnectedTabSpacing;
  readonly presentation?: ConnectedTabPresentation;
}) {
  const sizeClasses = {
    xs: "tw-min-h-[30px] tw-py-0",
    sm: "tw-min-h-8 tw-py-0",
    md: "tw-min-h-[34px] tw-min-w-11 tw-py-1.5 touch-only:tw-min-h-11 max-sm:tw-min-h-11",
  };
  const labelPadding = {
    xs: "tw-px-2.5",
    sm: "tw-px-[11px]",
    md: "tw-px-3",
  };
  let responsivePadding = "";
  if (spacing === "compact-mobile") {
    responsivePadding = "max-[400px]:tw-px-1";
  } else if (size === "md") {
    responsivePadding = "max-[360px]:tw-px-1.5";
  }
  const iconWidth = {
    xs: "tw-w-[30px]",
    sm: "tw-w-8",
    md: "tw-w-11",
  };
  const presentationClasses = {
    label: clsx(labelPadding[size], responsivePadding),
    icon: `tw-px-0 ${iconWidth[size]}`,
    sidebar: "tw-min-w-0 tw-px-2",
  };
  const defaultTypography = size === "md" ? "tw-text-[13px]" : "tw-text-xs";
  let fontWeight = "tw-font-medium";
  if (presentation === "sidebar") {
    fontWeight = isActive ? "tw-font-semibold" : "tw-font-normal";
  }

  return clsx(
    "tw-flex tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-leading-5",
    CONNECTED_TAB_INTERACTION_CLASSES,
    sizeClasses[size],
    presentationClasses[presentation],
    typography === "body" ? "tw-text-sm" : defaultTypography,
    fontWeight,
    fill && "tw-flex-1",
    getConnectedTabStateClasses({ isActive, activeTone })
  );
}
