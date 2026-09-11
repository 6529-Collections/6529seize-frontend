import { useId, type ChangeEvent, type ReactNode } from "react";

export const STUDIO_CONTROL_CLASS =
  "tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500/40";

export function StudioButton({
  children,
  onClick,
  disabled = false,
  active,
  primary = false,
  type = "button",
  label,
}: {
  readonly children: ReactNode;
  readonly onClick?: (() => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly primary?: boolean | undefined;
  readonly type?: "button" | "submit" | undefined;
  readonly label?: string | undefined;
}) {
  const color = primary
    ? "tw-border-primary-600 tw-bg-primary-600 tw-text-white hover:tw-bg-primary-700"
    : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-100 hover:tw-bg-iron-800";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 ${color} ${active ? "tw-ring-1 tw-ring-primary-400" : ""}`}
    >
      {children}
    </button>
  );
}

export function StudioField({
  label,
  value,
  onChange,
  multiline = false,
  help,
  maxLength,
  type = "text",
  invalid = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly multiline?: boolean | undefined;
  readonly help?: string | undefined;
  readonly maxLength?: number | undefined;
  readonly type?: "text" | "url" | undefined;
  readonly invalid?: boolean | undefined;
}) {
  const id = useId();
  const props = {
    id,
    value,
    maxLength,
    "aria-invalid": invalid || undefined,
    "aria-describedby": help ? `${id}-help` : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    className: STUDIO_CONTROL_CLASS,
  };
  return (
    <div className="tw-space-y-2">
      <label
        htmlFor={id}
        className="tw-block tw-text-xs tw-font-medium tw-text-iron-300"
      >
        {label}
      </label>
      {multiline ? (
        <textarea {...props} rows={5} />
      ) : (
        <input {...props} type={type} />
      )}
      {help ? (
        <p
          id={`${id}-help`}
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function StudioSelect({
  label,
  value,
  onChange,
  options,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
}) {
  const id = useId();
  return (
    <div className="tw-space-y-2">
      <label
        htmlFor={id}
        className="tw-block tw-text-xs tw-font-medium tw-text-iron-300"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={STUDIO_CONTROL_CLASS}
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
