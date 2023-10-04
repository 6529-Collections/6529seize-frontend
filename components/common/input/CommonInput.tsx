import { InputHTMLAttributes } from "react";

export default function CommonInput({
  name,
  type = "text",
  required = false,
  disabled = false,
  autoComplete = "off",
  value,
  placeholder = "",
}: {
  name: InputHTMLAttributes<HTMLInputElement>["name"];
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  required?: InputHTMLAttributes<HTMLInputElement>["required"];
  disabled?: InputHTMLAttributes<HTMLInputElement>["disabled"];
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  value: InputHTMLAttributes<HTMLInputElement>["value"];
  placeholder?: InputHTMLAttributes<HTMLInputElement>["placeholder"];
}) {
  return (
    <input
      type={type}
      name={name}
      required={required}
      disabled={disabled}
      value={value}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className={` ${
        disabled ? "tw-text-white/50 tw-bg-neutral-700/80" : "tw-text-white tw-bg-neutral-700/40"
      } tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out`}
    />
  );
}
