import clsx from "clsx";

import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "./compactActionButtonStyles";
import {
  getIconButtonLayoutClasses,
  type IconButtonLayout,
} from "./iconButtonLayouts";

export type IconButtonSize = 24 | 28 | 32 | 36 | 40 | 44;
export type IconButtonVariant =
  | "ghost"
  | "muted"
  | "subtle"
  | "secondary"
  | "outline"
  | "contrast"
  | "surface"
  | "action"
  | "selected"
  | "destructive";
export type IconButtonShape = "rounded" | "compact" | "circle";

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  24: "tw-size-6",
  28: "tw-size-7",
  32: "tw-size-8",
  36: "tw-size-9",
  40: "tw-size-10",
  44: "tw-size-11",
};

const TEXT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: "tw-text-iron-300 desktop-hover:hover:tw-text-white",
  muted: "tw-text-iron-500 desktop-hover:hover:tw-text-white",
  subtle: "tw-text-iron-300 desktop-hover:hover:tw-text-white",
  secondary: "tw-text-iron-300 desktop-hover:hover:tw-text-iron-50",
  outline: "tw-text-iron-300 desktop-hover:hover:tw-text-iron-100",
  contrast: "tw-text-iron-300 desktop-hover:hover:tw-text-iron-50",
  surface: "tw-text-iron-300 desktop-hover:hover:tw-text-white",
  action: "tw-text-white",
  selected: "tw-text-primary-300",
  destructive: "tw-text-rose-400 desktop-hover:hover:tw-text-rose-300",
};

const SURFACE_CLASSES: Record<IconButtonVariant, string> = {
  ghost:
    "tw-border-0 tw-bg-transparent desktop-hover:hover:tw-bg-iron-800 active:tw-bg-iron-900",
  muted:
    "tw-border-0 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 active:tw-bg-iron-900",
  subtle:
    "tw-border tw-border-solid tw-border-iron-800 tw-bg-white/[0.04] desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-white/[0.08] active:tw-bg-white/10",
  secondary:
    "tw-border-0 tw-bg-iron-800 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-bg-iron-700",
  outline:
    "tw-border-0 tw-bg-transparent tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-bg-iron-900",
  contrast: "tw-border-0 tw-bg-black tw-shadow-sm active:tw-bg-iron-800",
  surface:
    "tw-border-0 tw-bg-iron-900/95 tw-ring-1 tw-ring-inset tw-ring-iron-800/60 tw-backdrop-blur-sm desktop-hover:hover:tw-bg-iron-800 active:tw-bg-iron-900",
  action:
    "tw-border-0 tw-bg-primary-500 desktop-hover:hover:tw-bg-primary-600 active:tw-bg-primary-700",
  selected:
    "tw-border-0 tw-bg-primary-500/15 tw-ring-1 tw-ring-inset tw-ring-primary-400/25",
  destructive:
    "tw-border-0 tw-bg-transparent desktop-hover:hover:tw-bg-rose-500/10",
};

const INSET_SURFACE_CLASSES = {
  ghost:
    "tw-border-0 tw-bg-transparent desktop-hover:group-hover:tw-bg-iron-900 group-active:tw-bg-iron-800",
  subtle:
    "tw-border tw-border-solid tw-border-iron-800 tw-bg-white/[0.04] desktop-hover:group-hover:tw-border-iron-700 desktop-hover:group-hover:tw-bg-white/[0.08] group-active:tw-bg-white/10",
};

export interface IconButtonStyleOptions {
  readonly layout?: IconButtonLayout | undefined;
  readonly variant?: IconButtonVariant | undefined;
  readonly size?: IconButtonSize | undefined;
  readonly shape?: IconButtonShape | undefined;
  readonly expandTouchTarget?: boolean | undefined;
  readonly pressEffect?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly pending?: boolean | undefined;
  readonly className?: string | undefined;
}

function getIconButtonShapeClasses(shape: IconButtonShape) {
  if (shape === "circle") return "tw-rounded-full";
  return shape === "compact" ? "tw-rounded-md" : "tw-rounded-lg";
}

export function getIconButtonClasses({
  layout,
  variant = "ghost",
  size = 36,
  shape = "rounded",
  expandTouchTarget = false,
  pressEffect = false,
  disabled = false,
  pending = false,
  className,
  inset = false,
}: IconButtonStyleOptions & { readonly inset?: boolean }): string {
  if (layout) {
    return getIconButtonLayoutClasses({
      layout,
      disabled,
      selected: variant === "selected",
      className,
    });
  }
  return clsx(
    "tw-group tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-p-0 tw-transition tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
    SIZE_CLASSES[size],
    getIconButtonShapeClasses(shape),
    TEXT_CLASSES[variant],
    inset ? "tw-border-0 tw-bg-transparent" : SURFACE_CLASSES[variant],
    variant === "destructive"
      ? "focus-visible:tw-outline-rose-400"
      : "focus-visible:tw-outline-primary-400",
    expandTouchTarget && COMPACT_ACTION_TOUCH_TARGET_CLASS,
    pressEffect && "active:tw-scale-95",
    disabled ? "tw-cursor-not-allowed tw-opacity-50" : "tw-cursor-pointer",
    pending &&
      "aria-disabled:tw-cursor-wait aria-disabled:tw-opacity-50 disabled:tw-cursor-wait disabled:tw-opacity-70",
    className
  );
}

// Sheets keep their existing outer target and smaller, visible inner surface.
export function getInsetIconButtonSurfaceClasses(
  variant: "ghost" | "subtle",
  size: IconButtonSize,
  shape: IconButtonShape
) {
  return clsx(
    "tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none",
    SIZE_CLASSES[size],
    getIconButtonShapeClasses(shape),
    INSET_SURFACE_CLASSES[variant]
  );
}
