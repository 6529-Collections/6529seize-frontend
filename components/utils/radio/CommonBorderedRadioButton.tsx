type CommonBorderedRadioButtonProps<T extends string> = {
  readonly type: T;
  readonly selected: T;
  readonly disabled?: boolean | undefined;
  readonly variant?: "default" | "subtle" | undefined;
  readonly ariaLabel?: string | undefined;
  readonly onChange: (type: T) => void;
} & (
  | { readonly label: string; readonly children?: undefined }
  | { readonly label?: undefined; readonly children: React.ReactNode }
);

function getWrapperClasses({
  disabled,
  isSelected,
  isSubtle,
}: {
  readonly disabled: boolean;
  readonly isSelected: boolean;
  readonly isSubtle: boolean;
}) {
  if (isSelected && isSubtle) {
    return "tw-rounded-xl tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-500/30 tw-shadow-inner";
  }

  if (isSelected) {
    return "tw-rounded-lg tw-border-transparent tw-bg-primary-500/20 tw-ring-primary-400 tw-shadow-xl";
  }

  if (isSubtle) {
    const hoverClasses = disabled
      ? ""
      : "hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-ring-white/10";
    return `tw-rounded-xl tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 tw-shadow-inner ${hoverClasses}`;
  }

  const hoverClasses = disabled ? "" : "hover:tw-ring-iron-650";
  return `tw-rounded-lg tw-border-transparent tw-ring-iron-700 tw-bg-iron-800 tw-shadow ${hoverClasses}`;
}

function getLabelClasses({
  disabled,
  isSelected,
  isSubtle,
}: {
  readonly disabled: boolean;
  readonly isSelected: boolean;
  readonly isSubtle: boolean;
}) {
  if (isSelected) {
    return "tw-text-primary-400";
  }

  if (isSubtle) {
    const hoverClasses = disabled ? "" : "group-hover:tw-text-iron-300";
    return `tw-text-iron-400 ${hoverClasses}`;
  }

  const hoverClasses = disabled ? "" : "group-hover:tw-text-iron-200";
  return `tw-text-iron-300 ${hoverClasses}`;
}

export default function CommonBorderedRadioButton<T extends string>({
  type,
  selected,
  label,
  disabled = false,
  variant = "default",
  ariaLabel,
  onChange,
  children,
}: CommonBorderedRadioButtonProps<T>) {
  const isSelected = selected === type;
  const isSubtle = variant === "subtle";
  const wrapperClasses = getWrapperClasses({
    disabled,
    isSelected,
    isSubtle,
  });

  const inputClasses = isSelected
    ? "tw-text-primary-500 focus:tw-ring-primary-500"
    : "tw-text-primary-400 focus:tw-ring-primary-400";

  const labelClasses = getLabelClasses({ disabled, isSelected, isSubtle });

  const onSelectedChange = () => {
    if (!disabled) {
      onChange(type);
    }
  };
  return (
    <div
      onClick={onSelectedChange}
      className={`${wrapperClasses} tw-group tw-relative tw-flex tw-flex-1 ${
        isSubtle ? "tw-items-start" : "tw-items-center"
      } tw-gap-x-3 tw-border tw-border-solid tw-px-4 tw-py-4 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none ${
        disabled ? "tw-cursor-not-allowed tw-opacity-50" : "tw-cursor-pointer"
      }`}
    >
      <input
        id={type}
        type="radio"
        disabled={disabled}
        checked={isSelected}
        aria-label={ariaLabel}
        onChange={onSelectedChange}
        className={
          isSubtle
            ? "tw-peer tw-sr-only"
            : `${inputClasses} tw-form-radio tw-h-4 tw-w-4 tw-cursor-pointer tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-800 tw-ring-offset-iron-800 tw-transition tw-duration-300 tw-ease-out focus:tw-ring-2 sm:tw-h-5 sm:tw-w-5`
        }
      />
      {isSubtle && (
        <span
          aria-hidden="true"
          className={`tw-mt-1 tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
            isSelected
              ? "tw-border-primary-400 tw-bg-primary-500/10"
              : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
          }`}
        >
          <span
            className={`tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
              isSelected ? "tw-scale-100" : "tw-scale-0"
            }`}
          />
        </span>
      )}
      <div className="tw-flex tw-items-center tw-truncate tw-whitespace-nowrap tw-transition tw-duration-300 tw-ease-out">
        <div className="tw-flex tw-flex-col tw-truncate tw-text-base tw-font-semibold tw-transition tw-duration-300 tw-ease-out">
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
