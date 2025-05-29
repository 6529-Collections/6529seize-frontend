import React from "react";
import { TraitWrapperProps } from "./types";
import ValidationError from "../submission/ui/ValidationError";

export const TraitWrapper: React.FC<TraitWrapperProps> = ({
  label,
  readOnly = false,
  children,
  isBoolean = false,
  className,
  error,
  id,
}) => {
  // Generate unique IDs for accessibility
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  const hasError = !!error && !readOnly;

  if (isBoolean) {
    // Special layout for boolean fields
    return (
      <div className={`tw-group tw-relative ${className || ""}`}>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <label
            htmlFor={fieldId}
            className="tw-text-sm tw-font-medium tw-text-iron-300 tw-cursor-pointer tw-w-40 tw-flex-shrink-0"
          >
            {label}
          </label>
          <div className="tw-flex-1 tw-max-w-xs">
            {children}
          </div>
        </div>
        <ValidationError error={error} id={errorId} />
      </div>
    );
  }

  return (
    <div className={`tw-group tw-relative ${className || ""}`}>
      {/* Modern floating label design */}
      <div className="tw-relative">
        <label
          htmlFor={fieldId}
          className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all
            ${readOnly 
              ? "tw-text-iron-500" 
              : hasError 
                ? "tw-text-red-400" 
                : "tw-text-iron-300 group-focus-visible-within:tw-text-primary-400"
            }`}
        >
          {label}
        </label>
        
        <div className={`tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200
          ${hasError 
            ? "tw-shadow-[0_0_0_1px_rgba(239,68,68,0.1)]" 
            : readOnly
              ? ""
              : "group-focus-visible-within:tw-shadow-[0_0_0_1px_rgba(139,92,246,0.05)]"
          }`}
        >
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
        </div>
      </div>

      {/* Error message */}
      <ValidationError error={error} id={errorId} />
    </div>
  );
};
