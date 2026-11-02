import { forwardRef, type ComponentPropsWithoutRef } from "react";
import Button from "./Button";

type FilterButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "variant"
> & {
  readonly selected: boolean;
};

/** Shared filter appearance; callers keep their button or radio semantics. */
const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(
  ({ selected, disabled, size = "xs", className = "", ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      disabled={disabled}
      size={size}
      variant={selected && !disabled ? "filterSelected" : "filter"}
      className={`motion-reduce:tw-transition-none ${className}`}
    />
  )
);

FilterButton.displayName = "FilterButton";
export default FilterButton;
