import React from "react";
import { TraitWrapperProps } from "./types";
import ValidationError from "../submission/ui/ValidationError";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export const TraitWrapper: React.FC<TraitWrapperProps> = ({
  label,
  readOnly = false,
  children,
  isBoolean = false,
  className,
  error,
  id,
  isFieldFilled = false,
}) => {
  // Generate unique IDs for accessibility
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  const hasError = !!error && !readOnly;

  // Determine label styling based on state
  let labelClassName = "tw-text-iron-300 group-focus-visible-within:tw-text-primary-400";
  if (readOnly) {
    labelClassName = "tw-text-iron-500";
  } else if (hasError) {
    labelClassName = "tw-text-red-400";
  }

  if (isBoolean) {
    // Special layout for boolean fields
    return (
      <div className={`tw-group tw-relative ${className ?? ""}`}>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <label
            htmlFor={fieldId}
            className="tw-text-sm tw-font-medium tw-text-iron-300 tw-cursor-pointer tw-w-40 tw-flex-shrink-0"
          >
            {label}
          </label>
          <div className="tw-flex-1 tw-max-w-xs">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tw-group tw-relative ${className ?? ""}`}>
      {/* Modern floating label design */}
      <div className="tw-relative">
        <label
          htmlFor={fieldId}
          className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all ${labelClassName}`}
        >
          {label}
        </label>

        <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
          {/* Cloning children to pass additional props if needed */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                id: fieldId,
                "aria-invalid": hasError,
                "aria-describedby": errorId,
                ...(child.props || {}),
              } as any);
            }
            return child;
          })}

          {/* Checkmark icon for filled fields */}
          {isFieldFilled && !hasError && (
            <div className="tw-absolute tw-right-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-pointer-events-none">
              <CheckCircleIcon className="tw-text-emerald-500 tw-w-5 tw-h-5 tw-flex-shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      <ValidationError error={error} id={errorId} />
    </div>
  );
};
