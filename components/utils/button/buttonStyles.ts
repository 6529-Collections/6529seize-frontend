import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "action"
  | "secondary"
  | "tertiary"
  | "success"
  | "destructive";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "tw-border-iron-200 tw-bg-iron-200 tw-text-iron-950 desktop-hover:hover:tw-border-iron-300 desktop-hover:hover:tw-bg-iron-300 desktop-hover:hover:tw-text-iron-950 active:tw-border-iron-400 active:tw-bg-iron-400",
  action:
    "tw-border-primary-500 tw-bg-primary-500 tw-text-white tw-ring-1 tw-ring-inset tw-ring-white/10 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600 active:tw-border-primary-700 active:tw-bg-primary-700",
  secondary:
    "tw-border-white/10 tw-bg-white/[0.07] tw-text-iron-100 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-50 active:tw-bg-white/5",
  tertiary:
    "tw-border-iron-800 tw-bg-iron-950 tw-text-iron-100 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-black",
  success:
    "tw-border-emerald-600 tw-bg-emerald-600 tw-text-white desktop-hover:hover:tw-border-emerald-500 desktop-hover:hover:tw-bg-emerald-500 active:tw-border-emerald-700 active:tw-bg-emerald-700",
  destructive:
    "tw-border-red tw-bg-red tw-text-white desktop-hover:hover:tw-border-red/90 desktop-hover:hover:tw-bg-red/90 active:tw-border-red/80 active:tw-bg-red/80",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "tw-h-8 tw-px-2.5 tw-text-xs",
  sm: "tw-h-9 tw-px-3 tw-text-sm",
  md: "tw-h-10 tw-px-3.5 tw-text-sm",
  lg: "tw-min-h-11 tw-px-5 tw-py-2.5 tw-text-sm",
};

interface ButtonStyleOptions {
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | null | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly className?: string | undefined;
}

export function getButtonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return clsx(
    "tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-200 tw-ease-out enabled:tw-cursor-pointer focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50",
    VARIANT_CLASSES[variant],
    size && SIZE_CLASSES[size],
    fullWidth && "tw-w-full",
    className
  );
}
