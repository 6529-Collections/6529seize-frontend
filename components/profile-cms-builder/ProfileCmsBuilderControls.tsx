"use client";

import type { ReactNode } from "react";

export function Fieldset({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <fieldset className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4">
      <legend className="tw-px-2 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
        {title}
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
        {children}
      </div>
    </fieldset>
  );
}

export function TextInput({
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string | undefined;
  readonly type?: string | undefined;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="tw-min-h-11 tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-white focus:tw-border-primary-400 focus:tw-outline-none"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

export function TextArea({
  id,
  label,
  onChange,
  rows,
  value,
}: {
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly rows: number;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1 md:tw-col-span-2">
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        className="tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-text-sm tw-leading-6 tw-text-white focus:tw-border-primary-400 focus:tw-outline-none"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </div>
  );
}

export function SelectInput({
  id,
  label,
  onChange,
  options,
  value,
}: {
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: ReadonlyArray<{
    readonly label: string;
    readonly value: string;
  }>;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        className="tw-min-h-11 tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-white focus:tw-border-primary-400 focus:tw-outline-none"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TabButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`tw-min-h-10 tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-semibold ${
        active
          ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
          : "tw-border-transparent tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-700"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function BuilderActionButton({
  disabled,
  label,
  onClick,
  variant = "secondary",
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: "primary" | "secondary" | undefined;
}) {
  return (
    <button
      className={`tw-min-h-10 tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-semibold disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${
        variant === "primary"
          ? "tw-border-primary-400 tw-bg-primary-500 tw-text-white"
          : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-100 hover:tw-border-primary-400"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function focusField(fieldId: string): void {
  const element = globalThis.document?.getElementById(fieldId);
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in element && typeof element.focus === "function") {
    element.focus();
  }
}
