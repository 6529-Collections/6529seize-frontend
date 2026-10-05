import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import type { RefObject } from "react";

const DEFAULT_INPUT_CLASS_NAME =
  "tw-appearance-none -tw-ml-0.5 tw-block tw-w-full tw-rounded-l-none tw-rounded-r-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 focus:tw-bg-iron-950 tw-text-white tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-text-sm tw-transition tw-duration-300 tw-ease-out";

const DEFAULT_SPAN_CLASS_NAME =
  "tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-900 tw-rounded-l-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3";

const getValueStr = (val: string): string => {
  if (val.length > 1 && val.startsWith("0")) {
    return val.slice(1);
  }
  return val;
};

export default function UserPageRateInput({
  value,
  onChange,
  minMax,
  isProxy,
  inputRef,
  inputClassName = DEFAULT_INPUT_CLASS_NAME,
  spanClassName = DEFAULT_SPAN_CLASS_NAME,
  inputId,
  focusRingClassName,
  required = false,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly minMax: { min: number; max: number };
  readonly isProxy: boolean;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
  readonly inputClassName?: string;
  readonly spanClassName?: string;
  readonly inputId?: string;
  readonly focusRingClassName?: string;
  readonly required?: boolean;
}) {
  const valueAsNumber = getStringAsNumberOrZero(value);
  const isValidValue =
    isProxy || (valueAsNumber >= minMax.min && valueAsNumber <= minMax.max);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    const strVal = ["-0", "0-"].includes(inputValue) ? "-" : inputValue;
    if (/^-?\d*$/.test(strVal)) {
      onChange(getValueStr(strVal));
    }
  };

  const handleBlur = () => {
    if (isProxy) return;
    const { min, max } = minMax;
    const valueAsNumber = getStringAsNumberOrZero(value);
    if (valueAsNumber > max) {
      onChange(`${max}`);
      return;
    }
    if (valueAsNumber < min) {
      onChange(`${min}`);
    }
  };

  return (
    <>
      <span className={spanClassName}>
        <svg
          className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className="tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 tw-text-iron-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 12H19"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        id={inputId}
        autoComplete="off"
        required={required}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${
          focusRingClassName ??
          (isValidValue ? "focus:tw-ring-primary-400" : "focus:tw-ring-red")
        } ${inputClassName}`}
      />
    </>
  );
}
