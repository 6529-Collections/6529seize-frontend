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

export default function XtdhFilterNumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled,
}: Readonly<XtdhFilterNumberFieldProps>) {
  return (
    <label className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
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
          "tw-h-10 tw-w-44 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400",
          disabled ? "tw-opacity-50 tw-cursor-not-allowed" : ""
        )}
      />
    </label>
  );
}

