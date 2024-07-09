type CommonBorderedRadioButtonProps<T extends string> = {
  readonly type: T;
  readonly selected: T;
  readonly disabled?: boolean;
  readonly onChange: (type: T) => void;
} & (
  | { readonly label: string; readonly children?: never }
  | { readonly label?: never; readonly children: React.ReactNode }
);

export default function CommonBorderedRadioButton<T extends string>({
  type,
  selected,
  label,
  disabled = false,
  onChange,
  children,
}: CommonBorderedRadioButtonProps<T>) {
  const isSelected = selected === type;
  const wrapperClasses = isSelected
    ? "tw-ring-primary-400 tw-bg-[#202B45] tw-shadow-xl"
    : `tw-ring-iron-700 tw-bg-iron-800 tw-shadow ${
        disabled ? "" : "hover:tw-ring-iron-650"
      }`;

  const inputClasses = isSelected
    ? "tw-text-primary-500 focus:tw-ring-primary-500"
    : "tw-text-primary-400 focus:tw-ring-primary-400";

  const labelClasses = isSelected
    ? "tw-text-primary-400"
    : `tw-text-iron-300 ${disabled ? "" : "group-hover:tw-text-iron-200"}`;

  const onSelectedChange = () => {
    if (!disabled) {
      onChange(type);
    }
  };
  return (
    <div
      onClick={onSelectedChange}
      className={`${wrapperClasses} tw-flex-1 tw-group tw-relative tw-rounded-lg tw-ring-1 tw-ring-inset tw-px-4 tw-py-4 focus:tw-outline-none tw-flex tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out ${
        disabled ? "tw-opacity-50 tw-cursor-not-allowed" : "tw-cursor-pointer"
      }`}
    >
      <input
        id={type}
        type="radio"
        disabled={disabled}
        checked={isSelected}
        onChange={onSelectedChange}
        className={`${inputClasses} tw-form-radio tw-h-4 tw-w-4 sm:tw-h-5 sm:tw-w-5 tw-bg-iron-800 tw-border-iron-650 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out`}
      />
      <div className="tw-flex tw-items-center tw-whitespace-nowrap tw-truncate tw-transition tw-duration-300 tw-ease-out">
        <div className="tw-flex tw-flex-col tw-text-base tw-font-semibold tw-truncate tw-transition tw-duration-300 tw-ease-out">
          {label ? (
            <span
              className={`${labelClasses} ${
                disabled ? "tw-text-iron-600" : ""
              }`}
            >
              {label}
            </span>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
