import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import type { RefObject } from "react";

const INPUT_CLASS_NAME =
  "tw-touch-manipulation tw-appearance-none tw-block tw-min-w-0 tw-w-full tw-rounded-lg tw-border-0 tw-text-iron-100 tw-caret-primary-400 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 hover:tw-bg-iron-900 hover:tw-ring-iron-700 focus:tw-bg-iron-900 focus:tw-outline-none placeholder:tw-text-iron-500 tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none";

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
  variant = "compact",
  inputId,
  focusRingClassName,
  required = false,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly minMax: { min: number; max: number };
  readonly isProxy: boolean;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
  readonly variant?: "compact" | "form";
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
    <div className="tw-relative tw-w-full tw-min-w-0">
      <span
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-4 tw-flex tw-items-center tw-gap-3 tw-text-iron-500"
      >
        <span
          className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-0.5 ${variant === "form" ? "tw-translate-y-0.5" : ""}`}
        >
          <svg className="tw-size-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <svg className="tw-size-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {variant === "form" && (
          <span className="tw-h-7 tw-w-px tw-bg-iron-700/60" />
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        data-rating-input="true"
        id={inputId}
        autoComplete="off"
        required={required}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${
          focusRingClassName ??
          (isValidValue ? "focus:tw-ring-primary-400" : "focus:tw-ring-red")
        } ${INPUT_CLASS_NAME} ${variant === "form" ? "tw-bg-iron-900 tw-h-[46px] tw-py-3 tw-pl-16 tw-pr-4 tw-text-left tw-text-lg tw-font-medium tw-leading-5" : "tw-bg-iron-900/60 tw-px-10 tw-py-3 tw-text-center tw-tabular-nums tw-text-2xl tw-font-medium tw-leading-tight tw-tracking-tight"}`}
      />
    </div>
  );
}
