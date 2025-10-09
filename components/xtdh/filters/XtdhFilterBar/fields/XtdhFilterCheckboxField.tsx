import { classNames } from "@/helpers/Helpers";

interface XtdhFilterCheckboxFieldProps {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
  readonly disabled?: boolean;
}

export default function XtdhFilterCheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
}: Readonly<XtdhFilterCheckboxFieldProps>) {
  return (
    <label
      htmlFor={id}
      className={classNames(
        "tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium",
        disabled ? "tw-text-iron-500" : "tw-text-iron-200"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="tw-h-5 tw-w-5 tw-rounded tw-border tw-border-iron-800 tw-bg-iron-950 focus:tw-ring-primary-400"
      />
      <span>{label}</span>
    </label>
  );
}

