import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "tw-border-iron-200 tw-bg-iron-200 tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white desktop-hover:hover:tw-border-iron-300 desktop-hover:hover:tw-bg-iron-300 desktop-hover:hover:tw-text-iron-950 active:tw-border-iron-400 active:tw-bg-iron-400",
  secondary:
    "tw-border-white/10 tw-bg-white/[0.07] tw-text-iron-100 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-50 active:tw-bg-white/5",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "tw-h-8 tw-px-2.5 tw-text-xs",
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
    "tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-pointer-events-none disabled:tw-cursor-not-allowed disabled:tw-opacity-50",
    VARIANT_CLASSES[variant],
    size && SIZE_CLASSES[size],
    fullWidth && "tw-w-full",
    className
  );
}
