import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import type { RefObject } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const INPUT_CLASS_NAME =
  "tw-touch-manipulation tw-appearance-none tw-block tw-min-w-0 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900/60 tw-py-3 tw-text-center tw-leading-tight tw-font-medium tw-tabular-nums tw-tracking-tight tw-text-iron-100 tw-caret-primary-400 tw-ring-1 tw-ring-inset tw-ring-iron-800/60 hover:tw-bg-iron-900 hover:tw-ring-iron-700 focus:tw-bg-iron-900 focus:tw-outline-none placeholder:tw-text-iron-500 tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none";

const STEP_BUTTON_CLASS_NAME =
  "tw-absolute tw-top-1/2 -tw-translate-y-1/2 tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors enabled:tw-cursor-pointer enabled:hover:tw-bg-iron-800/60 enabled:hover:tw-text-iron-100 disabled:tw-cursor-not-allowed disabled:tw-text-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none";

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
  size = "compact",
  withStepper = false,
  inputLabel,
  inputId,
  focusRingClassName,
  required = false,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly minMax: { min: number; max: number };
  readonly isProxy: boolean;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
  readonly size?: "compact" | "prominent";
  readonly withStepper?: boolean;
  readonly inputLabel?: string;
  readonly inputId?: string;
  readonly focusRingClassName?: string;
  readonly required?: boolean;
}) {
  const locale = useBrowserLocale();
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

  const stepRating = (direction: -1 | 1) => {
    const nextValue = Math.min(
      minMax.max,
      Math.max(minMax.min, valueAsNumber + direction)
    );
    if (Number.isSafeInteger(nextValue) && nextValue !== valueAsNumber) {
      onChange(`${nextValue}`);
    }
  };

  return (
    <div className="tw-relative tw-w-full tw-min-w-0">
      {withStepper ? (
        <button
          type="button"
          aria-label={t(locale, "rating.amount.decrease")}
          disabled={
            valueAsNumber <= minMax.min ||
            !Number.isSafeInteger(valueAsNumber - 1)
          }
          onClick={() => stepRating(-1)}
          className={`${STEP_BUTTON_CLASS_NAME} tw-left-1`}
        >
          <svg
            aria-hidden="true"
            className="tw-size-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : (
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-4 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-0.5 tw-text-iron-500"
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
      )}
      <input
        ref={inputRef}
        type="text"
        data-rating-input="true"
        aria-label={inputLabel}
        id={inputId}
        autoComplete="off"
        required={required}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${
          focusRingClassName ??
          (isValidValue ? "focus:tw-ring-primary-400" : "focus:tw-ring-red")
        } ${INPUT_CLASS_NAME} ${withStepper ? "tw-px-12" : "tw-px-10"} ${size === "prominent" ? "tw-text-[2rem]" : "tw-text-2xl"}`}
      />
      {withStepper && (
        <button
          type="button"
          aria-label={t(locale, "rating.amount.increase")}
          disabled={
            valueAsNumber >= minMax.max ||
            !Number.isSafeInteger(valueAsNumber + 1)
          }
          onClick={() => stepRating(1)}
          className={`${STEP_BUTTON_CLASS_NAME} tw-right-1`}
        >
          <svg
            aria-hidden="true"
            className="tw-size-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
