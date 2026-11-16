import clsx from "clsx";

/** Shared appearance only: each selector retains its own sizing and behavior. */
export const DROPDOWN_TRIGGER_SURFACE_CLASSES =
  "tw-bg-iron-900 tw-font-medium tw-text-iron-300 tw-shadow-none tw-transition-colors tw-duration-150 enabled:tw-cursor-pointer enabled:desktop-hover:hover:tw-bg-iron-800 enabled:desktop-hover:hover:tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none";

/** Validation-aware selectors can retain ownership of their semantic edge color. */
export const DROPDOWN_TRIGGER_FRAME_CLASSES =
  "tw-border-0 tw-ring-1 tw-ring-inset focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px]";

export function getDropdownTriggerClasses({
  border = "inset",
  invalid = false,
  rounding = "all",
}: {
  readonly border?: "inset" | "solid";
  readonly invalid?: boolean;
  readonly rounding?: "all" | "right";
} = {}): string {
  const edge =
    border === "inset"
      ? DROPDOWN_TRIGGER_FRAME_CLASSES
      : "tw-border tw-border-solid focus:tw-ring-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2";
  let color = "tw-border-white/10 focus-visible:tw-outline-primary-400";
  if (border === "inset") {
    color = invalid
      ? "tw-ring-error focus:tw-ring-error focus-visible:tw-outline-error"
      : "tw-ring-white/10 focus:tw-ring-white/10 focus-visible:tw-outline-primary-400";
  } else if (invalid) {
    color = "tw-border-error focus-visible:tw-outline-error";
  }
  return clsx(
    DROPDOWN_TRIGGER_SURFACE_CLASSES,
    "focus:tw-outline-none",
    rounding === "right" ? "tw-rounded-r-lg" : "tw-rounded-lg",
    edge,
    color
  );
}

/** Inset edges preserve the box model of existing borderless triggers. */
export const DROPDOWN_TRIGGER_CLASSES = getDropdownTriggerClasses();

/** Native selects and input-like selectors retain their existing 1px border. */
export const DROPDOWN_FIELD_CLASSES = getDropdownTriggerClasses({
  border: "solid",
});

export const DROPDOWN_CHEVRON_CLASSES =
  "tw-size-4 tw-shrink-0 tw-text-iron-400";
