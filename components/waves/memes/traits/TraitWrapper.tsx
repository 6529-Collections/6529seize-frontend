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
}) => {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  const hasError = !!error && !readOnly;

  let labelClassName =
    "tw-text-iron-300 group-focus-visible-within:tw-text-primary-400";
  if (readOnly) {
    labelClassName = "tw-text-iron-500";
  } else if (hasError) {
    labelClassName = "tw-text-red-400";
  }

  if (isBoolean) {
    return (
      <div className={`tw-group tw-relative ${className ?? ""}`}>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <label
            htmlFor={fieldId}
            className="tw-w-40 tw-flex-shrink-0 tw-cursor-pointer tw-text-sm tw-font-medium tw-text-iron-300"
          >
            {label}
          </label>
          <div className="tw-max-w-xs tw-flex-1">{children}</div>
        </div>
      </div>
    );
  }

  const hasPaddingOverride = className?.includes("tw-pb-");
  const basePadding = hasPaddingOverride ? "" : "tw-pb-8";

  return (
    <div className={`tw-group tw-relative ${basePadding} ${className ?? ""}`}>
      <div className="tw-relative">
        <label
          htmlFor={fieldId}
          className={`tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-transition-all ${labelClassName}`}
        >
          {label}
        </label>

        <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
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

          {isFieldFilled && !hasError && (
            <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-transform">
              <CheckCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-emerald-500" />
            </div>
          )}
        </div>
      </div>

      {hasPaddingOverride ? (
        <ValidationError error={error} id={errorId} className="tw-mt-1" />
      ) : (
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0">
          <ValidationError error={error} id={errorId} className="tw-mt-0" />
        </div>
      )}
    </div>
  );
};
