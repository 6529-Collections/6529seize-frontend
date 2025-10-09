import type { ChangeEvent } from "react";
import { classNames } from "@/helpers/Helpers";

interface XtdhFilterNumberFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value?: number;
  readonly placeholder?: string;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly disabled?: boolean;
}

/**
 * Numeric filter field styled to align with dropdown controls.
 */
export default function XtdhFilterNumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled,
}: Readonly<XtdhFilterNumberFieldProps>) {
  return (
    <label
      htmlFor={id}
      className={classNames(
        "tw-relative tw-inline-block tw-min-w-[11rem] tw-w-full sm:tw-w-auto",
        disabled ? "tw-opacity-50" : ""
      )}
    >
      <span className="tw-pointer-events-none tw-absolute tw-left-3.5 tw-top-2 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {label}
      </span>
      <input
        id={id}
        type="number"
        min={0}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={classNames(
          "tw-h-12 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3.5 tw-pt-5 tw-text-sm tw-font-semibold tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 placeholder:tw-text-iron-400",
          disabled ? "tw-cursor-not-allowed" : ""
        )}
      />
    </label>
  );
}
