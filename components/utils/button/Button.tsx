import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

import {
  getButtonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | null | undefined;
  readonly loading?: boolean | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly hideChildrenWhenLoading?: boolean | undefined;
  readonly children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
    hideChildrenWhenLoading = false,
    type = "button",
    "aria-busy": ariaBusy,
    className,
    children,
    ...buttonProps
  },
  ref
) {
  const inactive = disabled || loading;
  const showChildren = !loading || !hideChildrenWhenLoading;

  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      disabled={inactive}
      aria-busy={loading || ariaBusy || undefined}
      className={getButtonClasses({
        variant,
        size,
        fullWidth,
        className,
      })}
    >
      {loading && <CircleLoader />}
      {showChildren && children}
    </button>
  );
});

export default Button;
