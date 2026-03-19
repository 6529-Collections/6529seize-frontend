import { CheckCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
import ValidationError from "../submission/ui/ValidationError";

interface TraitWrapperProps {
  readonly label: string;
  readonly readOnly?: boolean | undefined;
  readonly children: React.ReactNode;
  readonly isBoolean?: boolean | undefined;
  readonly className?: string | undefined;
  readonly error?: string | null | undefined;
  readonly id?: string | undefined;
  readonly isFieldFilled?: boolean | undefined;
  readonly labelRightAdornment?: React.ReactNode;
  readonly showRequiredMarker?: boolean | undefined;
  readonly labelTone?: "default" | "muted" | undefined;
  readonly size?: "default" | "sm" | undefined;
}

export const TraitWrapper: React.FC<TraitWrapperProps> = ({
  label,
  readOnly = false,
  children,
  isBoolean = false,
  className,
  error,
  id,
  isFieldFilled = false,
  labelRightAdornment,
  showRequiredMarker = false,
  labelTone = "default",
  size = "default",
}) => {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hasLabelRightAdornment =
    labelRightAdornment !== undefined && labelRightAdornment !== null;

  const hasError = !!error && !readOnly;

  let labelClassName =
    labelTone === "muted"
      ? "tw-text-iron-400 group-focus-visible-within:tw-text-primary-400"
      : "tw-text-iron-300 group-focus-visible-within:tw-text-primary-400";
  if (readOnly) {
    labelClassName = "tw-text-iron-500";
  } else if (hasError) {
    labelClassName = "tw-text-red-400";
  }

  if (isBoolean) {
    return (
      <div className={`tw-group tw-relative ${className ?? ""}`}>
        <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900 tw-px-4 tw-py-2.5">
          <label
            htmlFor={fieldId}
            className="tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-truncate tw-text-sm tw-font-medium tw-text-iron-300"
          >
            {label}
          </label>
          <div className="tw-flex-shrink-0">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tw-group tw-relative ${className ?? ""}`}>
      <div className="tw-relative">
        <label
          htmlFor={fieldId}
          className={`tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-rounded-sm tw-bg-iron-900 tw-px-1 tw-font-medium tw-transition-all ${hasLabelRightAdornment ? "tw-flex tw-items-center tw-gap-1" : ""} ${size === "sm" ? "tw-text-[11px]" : "tw-text-xs"} ${labelClassName}`}
        >
          <span className="tw-inline-flex tw-items-center tw-gap-0.5">
            <span>{label}</span>
            {showRequiredMarker && !readOnly && (
              <span aria-hidden="true" className="tw-text-iron-500">
                *
              </span>
            )}
          </span>
          {labelRightAdornment}
        </label>

        <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
          {React.Children.map(children, (child) => {
            if (React.isValidElement<Record<string, unknown>>(child)) {
              return React.cloneElement(child, {
                ...child.props,
                id: fieldId,
                "aria-invalid": hasError,
                "aria-describedby": errorId,
              });
            }
            return child;
          })}

          {!hasLabelRightAdornment && isFieldFilled && !hasError && (
            <div
              className={`tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center ${
                size === "sm" ? "tw-right-2.5" : "tw-right-3"
              }`}
            >
              <CheckCircleIcon
                className={`tw-flex-shrink-0 tw-text-emerald-500 ${
                  size === "sm" ? "tw-h-[18px] tw-w-[18px]" : "tw-h-5 tw-w-5"
                }`}
              />
            </div>
          )}
        </div>
      </div>

      <ValidationError error={error} id={errorId} className="tw-mt-1" />
    </div>
  );
};
