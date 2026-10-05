import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import type { RefObject } from "react";

import { USER_RATE_FIELD_CLASS_NAME } from "./userRateStyles";

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
  inputId,
  descriptionId,
  required = false,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly minMax: { min: number; max: number };
  readonly isProxy: boolean;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
  readonly inputId?: string;
  readonly descriptionId?: string | undefined;
  readonly required?: boolean;
}) {
  const valueAsNumber = getStringAsNumberOrZero(value);
  const isValidValue =
    /^-?\d+$/.test(value) &&
    (isProxy || (valueAsNumber >= minMax.min && valueAsNumber <= minMax.max));

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
    <input
      ref={inputRef}
      type="text"
      id={inputId}
      autoComplete="off"
      spellCheck={false}
      pattern="-?[0-9]+"
      required={required}
      aria-invalid={value !== "" && !isValidValue}
      aria-describedby={descriptionId}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`${USER_RATE_FIELD_CLASS_NAME} tw-tabular-nums ${
        value !== "" && !isValidValue ? "!tw-border-red focus:!tw-ring-red" : ""
      }`}
    />
  );
}
