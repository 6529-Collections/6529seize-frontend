import { forwardRef, type ComponentPropsWithoutRef } from "react";
import Button from "./Button";

type FilterButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "variant"
> & {
  readonly selected: boolean;
  readonly desktopText?: boolean;
};

/** Shared filter appearance; callers keep their button or radio semantics. */
const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  (
    {
      selected,
      desktopText = false,
      disabled,
      size = "xs",
      className = "",
      ...props
    },
    ref
  ) => (
    <Button
      {...props}
      ref={ref}
      disabled={disabled}
      size={size}
      variant={selected && !disabled ? "primary" : "filter"}
      className={`motion-reduce:tw-transition-none ${
        desktopText && !selected
          ? "lg:tw-border-transparent lg:tw-bg-transparent lg:tw-shadow-none lg:active:tw-bg-iron-900 lg:desktop-hover:hover:tw-border-transparent lg:desktop-hover:hover:tw-bg-iron-900/50"
          : ""
      } ${className}`}
    />
  )
);

FilterButton.displayName = "FilterButton";
export default FilterButton;
