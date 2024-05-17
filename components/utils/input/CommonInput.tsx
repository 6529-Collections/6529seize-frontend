type InputProps = {
  readonly value: string;
  readonly placeholder?: string;
  readonly showSearchIcon?: boolean;
  readonly disabled?: boolean;
  readonly theme?: "dark" | "light";
  readonly size?: "sm" | "md";
  readonly onChange: (newV: string | null) => void;
  readonly onFocusChange?: (focus: boolean) => void;
};

type NumberInputProps = InputProps & {
  readonly inputType: "number";
  readonly minValue?: number;
  readonly maxValue?: number;
};

type TextInputProps = InputProps & {
  readonly inputType?: "text";
  readonly maxLength?: number;
};

export default function CommonInput(props: NumberInputProps | TextInputProps) {
  const {
    value,
    placeholder,
    showSearchIcon,
    onChange,
    onFocusChange,
    inputType = "text",
    disabled = false,
    theme = "dark",
    size = "md",
  } = props;

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      onChange(null);
      return;
    }
    if (props.inputType === "number") {
      const numericValue = parseFloat(e.target.value);
      if (isNaN(numericValue)) {
        onChange(null);
        return;
      }

      if (props.minValue !== undefined && numericValue < props.minValue) {
        onChange(props.minValue.toString());
        return;
      }

      if (props.maxValue !== undefined && numericValue > props.maxValue) {
        onChange(props.maxValue.toString());
        return;
      }
    } else if (props.inputType === "text") {
      if (
        props.maxLength !== undefined &&
        e.target.value.length > props.maxLength
      ) {
        onChange(e.target.value.substring(0, props.maxLength));
        return;
      }
    }

    onChange(e.target.value);
  };

  const min = props.inputType === "number" ? props.minValue : undefined;
  const max = props.inputType === "number" ? props.maxValue : undefined;
  const maxLength = props.inputType === "text" ? props.maxLength : undefined;

  return (
    <div className="tw-relative">
      {showSearchIcon && (
        <svg
          className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        min={min}
        max={max}
        maxLength={maxLength}
        disabled={disabled}
        onChange={onInput}
        onFocus={() => onFocusChange && onFocusChange(true)}
        onBlur={() => onFocusChange && onFocusChange(false)}
        className={`${showSearchIcon ? "tw-pl-11" : ""} ${
          disabled ? "tw-opacity-40" : ""
        } ${theme === "dark" ? "tw-bg-iron-900" : "tw-bg-iron-800"} ${
          size === "md" ? "tw-py-2.5" : "tw-py-2"
        } tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-pr-3 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out`}
      />
    </div>
  );
}
