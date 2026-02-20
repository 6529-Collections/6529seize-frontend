"use client";

import { forwardRef } from "react";

interface CreateCurationDropUrlInputProps {
  readonly value: string;
  readonly disabled: boolean;
  readonly isInvalid: boolean;
  readonly helperText?: string | undefined;
  readonly showHelperText?: boolean | undefined;
  readonly scrollMarginTopClassName?: string | undefined;
  readonly canonicalUrl: string | null;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly onSubmit: () => void;
}

const CreateCurationDropUrlInput = forwardRef<
  HTMLInputElement,
  CreateCurationDropUrlInputProps
>(
  (
    {
      value,
      disabled,
      isInvalid,
      helperText,
      showHelperText = true,
      scrollMarginTopClassName,
      canonicalUrl,
      onChange,
      onBlur,
      onSubmit,
    },
    ref
  ) => {
    const inputRingClasses = isInvalid
      ? "tw-ring-red-500 focus:tw-ring-red-500"
      : "tw-ring-iron-700 hover:tw-ring-iron-600 focus:tw-ring-primary-400";

    return (
      <div className="tw-flex tw-w-full tw-flex-col">
        <label htmlFor="curation-drop-url-input" className="tw-sr-only">
          Curation URL
        </label>
        <input
          ref={ref}
          id="curation-drop-url-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }
            event.preventDefault();
            onSubmit();
          }}
          placeholder="Enter supported curation URL"
          className={`tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-3 tw-pr-3 tw-text-base tw-font-normal tw-leading-6 tw-text-white tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-950 focus:tw-outline-none sm:tw-text-sm ${inputRingClasses} ${
            disabled ? "tw-cursor-default tw-opacity-50" : ""
          } ${scrollMarginTopClassName ?? ""}`}
          aria-invalid={isInvalid}
          aria-describedby={
            showHelperText ? "curation-drop-url-helper" : undefined
          }
        />
        {showHelperText && (
          <div className="tw-mt-1 tw-min-h-[1rem]">
            <p
              id="curation-drop-url-helper"
              role={isInvalid ? "alert" : undefined}
              aria-live="polite"
              className={`tw-text-xs ${
                isInvalid ? "tw-text-red-400" : "tw-text-iron-400"
              }`}
            >
              {helperText}
            </p>
          </div>
        )}
        {canonicalUrl && canonicalUrl !== value.trim() && (
          <p className="tw-text-[11px] tw-text-iron-500">
            Will submit as: {canonicalUrl}
          </p>
        )}
      </div>
    );
  }
);

CreateCurationDropUrlInput.displayName = "CreateCurationDropUrlInput";

export default CreateCurationDropUrlInput;
