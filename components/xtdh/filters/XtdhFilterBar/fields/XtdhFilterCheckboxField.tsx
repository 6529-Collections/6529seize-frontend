import { classNames } from "@/helpers/Helpers";

interface XtdhFilterCheckboxFieldProps {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
  readonly disabled?: boolean;
}

/**
 * Toggle-styled filter control used in desktop filter panels.
 */
export default function XtdhFilterCheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: Readonly<XtdhFilterCheckboxFieldProps>) {
  return (
    <label
      htmlFor={id}
      className={classNames(
        "tw-flex tw-items-center tw-gap-3 tw-select-none",
        disabled ? "tw-cursor-not-allowed tw-text-iron-500" : "tw-cursor-pointer tw-text-iron-100"
      )}
    >
      <span
        className={classNames(
          "tw-rounded-full tw-bg-gradient-to-b tw-p-[1px]",
          disabled
            ? "tw-from-iron-800 tw-to-iron-900"
            : checked
            ? "tw-from-primary-400 tw-to-primary-600"
            : "tw-from-iron-700 tw-to-iron-800"
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="tw-peer tw-sr-only"
        />
        <span
          aria-hidden="true"
          className={classNames(
            "tw-relative tw-flex tw-h-6 tw-w-11 tw-items-center tw-justify-start tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-out tw-peer-focus-visible:tw-ring-2 tw-peer-focus-visible:tw-ring-primary-400 tw-peer-focus-visible:tw-ring-offset-2 tw-peer-focus-visible:tw-ring-offset-iron-950",
            disabled
              ? "tw-opacity-60 tw-bg-iron-800 tw-peer-focus-visible:tw-ring-0"
              : checked
              ? "tw-bg-primary-500"
              : "tw-bg-iron-700"
          )}
        >
          <span
            className={classNames(
              "tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-out",
              checked ? "tw-translate-x-5" : "tw-translate-x-0"
            )}
          />
        </span>
      </span>
      <span className="tw-text-sm tw-font-semibold tw-whitespace-nowrap">{label}</span>
    </label>
  );
}
