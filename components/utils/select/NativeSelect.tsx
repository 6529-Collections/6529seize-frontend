import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useDropdownToolbarMetrics } from "./dropdown/DropdownToolbar";
import {
  DROPDOWN_CHEVRON_CLASSES,
  getDropdownTriggerClasses,
  getDropdownMenuMetrics,
  type DropdownMetrics,
  type DropdownVariant,
} from "./dropdown/dropdownTriggerStyles";

/** Use an associated label or pass an accessible name to the native select. */
const NativeSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    readonly variant?: DropdownVariant;
    readonly metrics?: Omit<DropdownMetrics, "right">;
    readonly invalid?: boolean;
  }
>(
  (
    {
      className = "",
      children,
      variant = "form",
      metrics,
      invalid = false,
      ...props
    },
    ref
  ) => {
    const toolbarMetrics = useDropdownToolbarMetrics();
    return (
      <span className="tw-relative tw-block tw-w-full">
        <select
          {...props}
          ref={ref}
          className={`${getDropdownTriggerClasses({ variant, invalid, metrics: { ...getDropdownMenuMetrics(variant), ...metrics, ...toolbarMetrics, right: 36 } })} tw-peer tw-block tw-w-full tw-appearance-none tw-bg-none ${className}`}
        >
          {children}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className={`${DROPDOWN_CHEVRON_CLASSES} tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 peer-disabled:tw-opacity-50`}
        />
      </span>
    );
  }
);

NativeSelect.displayName = "NativeSelect";

export default NativeSelect;
