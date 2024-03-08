import { HTMLInputTypeAttribute } from "react";

export default function CommonInput({
  value,
  inputType = "text",
  placeholder = "",
  onChange,
  onFocusChange,
}: {
  readonly value: string;
  readonly inputType?: HTMLInputTypeAttribute;
  readonly placeholder?: string;
  readonly onChange: (newV: string | null) => void;
  readonly onFocusChange?: (focus: boolean) => void;
}) {
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      onChange(null);
      return;
    }
    onChange(e.target.value);
  };
  return (
    <input
      type={inputType}
      placeholder={placeholder}
      value={value}
      onChange={onInput}
      onFocus={() => onFocusChange && onFocusChange(true)}
      onBlur={() => onFocusChange && onFocusChange(false)}
      className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3  tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
    />
  );
}
