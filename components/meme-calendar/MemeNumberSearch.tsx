"use client";

import clsx from "clsx";
import type { FormEvent, RefObject } from "react";
import MemeNumberSubmitButton from "./MemeNumberSubmitButton";

interface MemeNumberSearchProps {
  readonly id: string;
  readonly value: string;
  readonly error?: string | undefined;
  readonly label: string;
  readonly submitLabel: string;
  readonly max: number;
  readonly inputRef?: RefObject<HTMLInputElement | null> | undefined;
  readonly className?: string | undefined;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function MemeNumberSearch({
  id,
  value,
  error,
  label,
  submitLabel,
  max,
  inputRef,
  className,
  onChange,
  onSubmit,
}: MemeNumberSearchProps) {
  const errorId = `${id}-error`;

  return (
    <form
      className={clsx(
        "tw-w-full tw-min-w-0 tw-max-w-full tw-flex-none sm:tw-w-auto sm:tw-flex-1 lg:tw-w-44 lg:tw-flex-none",
        className
      )}
      noValidate
      onSubmit={onSubmit}
    >
      <div
        className={clsx(
          "tw-flex tw-h-9 tw-w-full tw-min-w-0 tw-items-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-bg-iron-900 tw-pl-3 tw-text-[13px] tw-font-semibold tw-leading-[18px] tw-text-iron-200 tw-shadow-sm tw-shadow-black/20 tw-transition-colors focus-within:tw-border-primary-400 focus-within:tw-ring-1 focus-within:tw-ring-primary-400",
          error ? "tw-border-error" : "tw-border-iron-700"
        )}
      >
        <label htmlFor={id} className="tw-shrink-0 tw-select-none tw-pr-1">
          {label}
        </label>
        <input
          id={id}
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          name={id}
          placeholder="123"
          value={value}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) =>
            onChange(event.currentTarget.value.replaceAll(/\D/g, ""))
          }
          className="tw-h-8 tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-px-1 tw-text-[13px] tw-font-semibold tw-leading-[18px] tw-text-iron-50 tw-outline-none [appearance:textfield] placeholder:tw-text-iron-600 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
        />
        <div className="tw-flex tw-h-full tw-flex-none tw-border-0 tw-border-l tw-border-solid tw-border-iron-700">
          <MemeNumberSubmitButton inputId={id} label={submitLabel} />
        </div>
      </div>
      {error && (
        <p
          id={errorId}
          className="tw-mb-0 tw-mt-1.5 tw-text-[13px] tw-leading-[18px] tw-text-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
