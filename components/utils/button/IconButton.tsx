import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { getIconButtonLayoutSurfaceClasses } from "./iconButtonLayouts";

import {
  getIconButtonClasses,
  getInsetIconButtonSurfaceClasses,
  type IconButtonSize,
  type IconButtonStyleOptions,
  type IconButtonVariant,
} from "./iconButtonStyles";

type SurfaceOptions =
  | {
      readonly variant?: IconButtonVariant | undefined;
      readonly surfaceSize?: never;
    }
  | {
      readonly variant: "ghost" | "subtle";
      readonly surfaceSize: IconButtonSize;
    };

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> &
  Omit<IconButtonStyleOptions, "variant"> &
  SurfaceOptions & {
    readonly "aria-label": string;
    readonly children: ReactNode;
  };

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      layout,
      variant = "ghost",
      size = 36,
      shape = "rounded",
      surfaceSize,
      expandTouchTarget = false,
      pressEffect = false,
      pending = false,
      disabled = false,
      type = "button",
      className,
      children,
      ...buttonProps
    },
    ref
  ) => {
    let surfaceClasses = layout
      ? getIconButtonLayoutSurfaceClasses(layout)
      : undefined;
    if (
      !layout &&
      surfaceSize !== undefined &&
      (variant === "ghost" || variant === "subtle")
    ) {
      surfaceClasses = getInsetIconButtonSurfaceClasses(
        variant,
        surfaceSize,
        shape
      );
    }
    return (
      <button
        {...buttonProps}
        ref={ref}
        type={type}
        disabled={disabled}
        className={getIconButtonClasses({
          layout,
          variant,
          size,
          shape,
          expandTouchTarget,
          pressEffect,
          pending,
          disabled,
          inset: surfaceSize !== undefined,
          className,
        })}
      >
        {surfaceClasses ? (
          <span className={surfaceClasses}>{children}</span>
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
