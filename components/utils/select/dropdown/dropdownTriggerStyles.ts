import clsx from "clsx";

const DROPDOWN_SURFACE_CLASSES =
  "tw-bg-iron-900 tw-shadow-none tw-transition-colors tw-duration-150 enabled:desktop-hover:hover:tw-bg-iron-800 enabled:desktop-hover:hover:tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none";

/** The same surface is used by all three dropdown variants. */
export const DROPDOWN_TRIGGER_SURFACE_CLASSES = `${DROPDOWN_SURFACE_CLASSES} tw-font-medium tw-text-iron-300 enabled:tw-cursor-pointer`;

/** Validation-aware selectors can retain ownership of their semantic edge color. */
export const DROPDOWN_TRIGGER_FRAME_CLASSES =
  "tw-border-0 tw-ring-1 tw-ring-inset focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px]";

export type DropdownVariant = "compact" | "regular" | "form";

type Space =
  | 0
  | 2
  | 4
  | 6
  | 8
  | 10
  | 11
  | 12
  | 14
  | 16
  | 20
  | 24
  | 32
  | 36
  | 40
  | 44
  | 48;

/** Geometry is independent of appearance so existing controls do not resize. */
export interface DropdownMetrics {
  readonly height?: 28 | 32 | 36 | 40 | 42 | 44 | "subscription" | "responsive";
  readonly minHeight?: 0 | 40 | 44;
  readonly x?: Space;
  readonly y?: Space;
  readonly left?: Space;
  readonly right?: Space;
  readonly start?: 12;
  readonly end?: 40;
  readonly text?:
    | "inherit"
    | "xs"
    | "sm"
    | "base"
    | "responsive"
    | "touch"
    | "document"
    | "meta"
    | "small";
  readonly leading?: "5" | "6" | "7" | "responsive" | "none";
}

const SPACE_CLASSES = {
  x: {
    0: "tw-px-0",
    2: "tw-px-0.5",
    4: "tw-px-1",
    6: "tw-px-1.5",
    8: "tw-px-2",
    10: "tw-px-2.5",
    11: "tw-px-[11px]",
    12: "tw-px-3",
    14: "tw-px-3.5",
    16: "tw-px-4",
    20: "tw-px-5",
    24: "tw-px-6",
    32: "tw-px-8",
    36: "tw-px-9",
    40: "tw-px-10",
    44: "tw-px-11",
    48: "tw-px-12",
  },
  y: {
    0: "tw-py-0",
    2: "tw-py-0.5",
    4: "tw-py-1",
    6: "tw-py-1.5",
    8: "tw-py-2",
    10: "tw-py-2.5",
    11: "tw-py-[11px]",
    12: "tw-py-3",
    14: "tw-py-3.5",
    16: "tw-py-4",
    20: "tw-py-5",
    24: "tw-py-6",
    32: "tw-py-8",
    36: "tw-py-9",
    40: "tw-py-10",
    44: "tw-py-11",
    48: "tw-py-12",
  },
  left: {
    0: "tw-pl-0",
    2: "tw-pl-0.5",
    4: "tw-pl-1",
    6: "tw-pl-1.5",
    8: "tw-pl-2",
    10: "tw-pl-2.5",
    11: "tw-pl-[11px]",
    12: "tw-pl-3",
    14: "tw-pl-3.5",
    16: "tw-pl-4",
    20: "tw-pl-5",
    24: "tw-pl-6",
    32: "tw-pl-8",
    36: "tw-pl-9",
    40: "tw-pl-10",
    44: "tw-pl-11",
    48: "tw-pl-12",
  },
  right: {
    0: "tw-pr-0",
    2: "tw-pr-0.5",
    4: "tw-pr-1",
    6: "tw-pr-1.5",
    8: "tw-pr-2",
    10: "tw-pr-2.5",
    11: "tw-pr-[11px]",
    12: "tw-pr-3",
    14: "tw-pr-3.5",
    16: "tw-pr-4",
    20: "tw-pr-5",
    24: "tw-pr-6",
    32: "tw-pr-8",
    36: "tw-pr-9",
    40: "tw-pr-10",
    44: "tw-pr-11",
    48: "tw-pr-12",
  },
  start: { 12: "tw-ps-3" },
  end: { 40: "tw-pe-10" },
} as const;
const HEIGHT_CLASSES = {
  28: "tw-h-7",
  32: "tw-h-8",
  36: "tw-h-9",
  40: "tw-h-10",
  42: "tw-h-[42px]",
  44: "tw-h-11",
  subscription: "tw-h-11 md:tw-h-9",
  responsive: "tw-h-11 sm:tw-h-9",
} as const;
const TEXT_CLASSES = {
  inherit: "",
  xs: "tw-text-xs",
  sm: "tw-text-sm",
  base: "tw-text-base",
  responsive: "tw-text-base sm:tw-text-sm",
  touch: "tw-text-sm touch-only:tw-text-base",
  document: "tw-text-base tw-leading-7",
  meta: "tw-text-meta",
  small: "tw-text-[13px]",
} as const;
const LEGACY_SMALL_MENU_METRICS: DropdownMetrics = {
  left: 12,
  right: 36,
  y: 10,
  text: "xs",
  leading: "5",
};
const DEFAULT_METRICS: Record<DropdownVariant, DropdownMetrics> = {
  compact: { height: 32, x: 12, text: "xs" },
  regular: { left: 12, right: 36, y: 12, text: "sm", leading: "5" },
  form: { minHeight: 44, x: 12, y: 8, text: "sm" },
};

/** Compatibility for responsive tab/select controls; new controls choose a variant. */
export function getDropdownMenuMetrics(
  variant: DropdownVariant,
  size?: "sm" | "md" | "tabs"
): DropdownMetrics {
  if (size === "tabs") return { ...DEFAULT_METRICS.regular, y: 11 };
  if (size === "sm") return LEGACY_SMALL_MENU_METRICS;
  if (size === "md") return DEFAULT_METRICS.regular;
  // Menu selectors position the chevron separately from the label.
  return variant === "compact"
    ? { ...DEFAULT_METRICS.compact, right: 36 }
    : DEFAULT_METRICS[variant];
}

const MIN_HEIGHT_CLASSES = {
  0: "tw-min-h-0",
  40: "tw-min-h-10",
  44: "tw-min-h-11",
} as const;
const LEADING_CLASSES = {
  5: "tw-leading-5",
  6: "tw-leading-6",
  7: "tw-leading-7",
  none: "tw-leading-none",
  responsive: "sm:tw-leading-6",
} as const;

function metricClass<Key extends string | number>(
  classes: Record<Key, string>,
  key: Key | undefined
): string | undefined {
  return key === undefined ? undefined : classes[key];
}

export function getDropdownMetricsClasses(metrics: DropdownMetrics): string {
  return clsx(
    metricClass(HEIGHT_CLASSES, metrics.height),
    metricClass(MIN_HEIGHT_CLASSES, metrics.minHeight),
    metricClass(SPACE_CLASSES.x, metrics.x),
    metricClass(SPACE_CLASSES.y, metrics.y),
    metricClass(SPACE_CLASSES.left, metrics.left),
    metricClass(SPACE_CLASSES.right, metrics.right),
    metricClass(SPACE_CLASSES.start, metrics.start),
    metricClass(SPACE_CLASSES.end, metrics.end),
    metricClass(TEXT_CLASSES, metrics.text),
    metricClass(LEADING_CLASSES, metrics.leading)
  );
}

export function getDropdownTriggerClasses({
  variant = "regular",
  metrics = DEFAULT_METRICS[variant],
  border = variant === "form" ? "solid" : "inset",
  invalid = false,
  rounding = "all",
  textInput = false,
  externalValidation = false,
}: {
  readonly variant?: DropdownVariant;
  readonly metrics?: DropdownMetrics;
  readonly border?: "inset" | "solid";
  readonly invalid?: boolean;
  readonly rounding?: "all" | "right";
  readonly textInput?: boolean;
  readonly externalValidation?: boolean;
} = {}): string {
  const edge =
    border === "inset"
      ? DROPDOWN_TRIGGER_FRAME_CLASSES
      : "tw-border tw-border-solid focus:tw-ring-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2";
  let color = "tw-border-white/[0.08] focus-visible:tw-outline-primary-400";
  if (border === "inset") {
    color = invalid
      ? "tw-ring-error focus:tw-ring-error focus-visible:tw-outline-error"
      : "tw-ring-white/[0.08] focus:tw-ring-white/[0.08] focus-visible:tw-outline-primary-400";
  } else if (invalid) {
    color = "tw-border-error focus-visible:tw-outline-error";
  }
  return clsx(
    textInput
      ? `${DROPDOWN_SURFACE_CLASSES} enabled:tw-cursor-text`
      : DROPDOWN_TRIGGER_SURFACE_CLASSES,
    getDropdownMetricsClasses(metrics),
    "focus:tw-outline-none",
    rounding === "right" ? "tw-rounded-r-lg" : "tw-rounded-lg",
    edge,
    externalValidation ? "focus-visible:tw-outline-primary-400" : color
  );
}

export const DROPDOWN_CHEVRON_CLASSES =
  "tw-size-4 tw-shrink-0 tw-text-iron-400";

export const DROPDOWN_CHECKMARK_CLASSES = "tw-text-iron-300";

export const DROPDOWN_SELECTED_OPTION_CLASSES =
  "tw-bg-iron-800 tw-text-iron-100";

export const DROPDOWN_PANEL_SURFACE_CLASSES =
  "tw-rounded-lg tw-bg-iron-900 tw-shadow-lg tw-ring-1 tw-ring-white/10";

/** Headless UI uses data-focus for both pointer hover and keyboard navigation. */
export const DROPDOWN_OPTION_ACTIVE_CLASSES =
  "data-[focus]:tw-bg-iron-800 data-[focus]:tw-text-iron-100 data-[focus]:focus-visible:tw-ring-2 data-[focus]:focus-visible:tw-ring-inset data-[focus]:focus-visible:tw-ring-iron-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100 data-[selected]:tw-bg-iron-800 data-[selected]:tw-text-iron-100 aria-pressed:tw-bg-iron-800 aria-pressed:tw-text-iron-100";

/** Option appearance only; each picker keeps its selection and keyboard logic. */
export function getDropdownOptionStateClasses(selected: boolean): string {
  return clsx(
    DROPDOWN_OPTION_ACTIVE_CLASSES,
    selected
      ? DROPDOWN_SELECTED_OPTION_CLASSES
      : "tw-bg-transparent tw-text-iron-200"
  );
}

/** Keep listbox keyboard focus visible inside the active row, without framing the popup. */
export const DROPDOWN_LISTBOX_FOCUS_CLASSES =
  "focus:tw-outline-none [&_[role=option][data-focus]:not(:hover)]:focus-visible:tw-shadow-[inset_2px_0_0_0_var(--tw-shadow-color)] [&_[role=option][data-focus]:not(:hover)]:focus-visible:tw-shadow-iron-400";

/** Typography, selection indicators and row geometry belong to the consumer. */
export const DROPDOWN_OPTION_SURFACE_CLASSES = `${DROPDOWN_OPTION_ACTIVE_CLASSES} tw-rounded-lg tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none`;

/** Native selects inside a framed trigger inherit its surface and text color. */
export function getEmbeddedDropdownClasses(metrics: DropdownMetrics): string {
  return clsx(
    "tw-cursor-pointer tw-appearance-none tw-border-0 tw-bg-transparent tw-font-medium tw-text-inherit focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-iron-400 disabled:tw-cursor-not-allowed",
    getDropdownMetricsClasses(metrics)
  );
}

function getEditorialButtonStateClass(disabled: boolean) {
  if (disabled) {
    return "tw-cursor-not-allowed tw-text-iron-500 tw-opacity-50";
  }

  return "tw-text-iron-300 hover:tw-text-iron-100";
}

function getEditorialUnderlineClass(isOpen: boolean, disabled: boolean) {
  if (isOpen && !disabled) {
    return "after:tw-scale-x-100 after:tw-bg-primary-400";
  }

  return "after:tw-scale-x-0 after:tw-bg-iron-700 hover:after:tw-scale-x-100";
}

export function getEditorialDropdownClasses(
  isOpen: boolean,
  disabled: boolean
): string {
  return `${getEditorialButtonStateClass(disabled)} ${getEditorialUnderlineClass(isOpen, disabled)} tw-group tw-relative tw-inline-flex tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-left tw-text-sm tw-font-semibold tw-leading-5 tw-caret-primary-400 tw-shadow-none tw-transition tw-duration-200 tw-ease-out after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus:tw-outline-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-text-iron-100`;
}
