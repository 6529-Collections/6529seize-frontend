type CommonBorderedRadioButtonProps<T extends string> = {
  readonly type: T;
  readonly selected: T;
  readonly onChange: (type: T) => void;
} & (
  | { readonly label: string; readonly children?: never }
  | { readonly label?: never; readonly children: React.ReactNode }
);

export default function CommonBorderedRadioButton<T extends string>({
  type,
  selected,
  label,
  onChange,
  children,
}: CommonBorderedRadioButtonProps<T>) {
  const isSelected = selected === type;
  const wrapperClasses = isSelected
    ? "tw-ring-primary-400 tw-bg-[#202B45] tw-shadow-xl"
    : "tw-ring-iron-700 tw-bg-iron-800 hover:tw-ring-iron-650 tw-shadow";

  const inputClasses = isSelected
    ? "tw-text-primary-500 focus:tw-ring-primary-500"
    : "tw-text-primary-400 focus:tw-ring-primary-400";

  const labelClasses = isSelected
    ? "tw-text-primary-400"
    : "tw-text-iron-300 hover:tw-text-iron-200";
  return (
    <div
      onClick={() => onChange(type)}
      className={`${wrapperClasses} tw-flex-1 tw-relative tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-px-4 tw-py-4 focus:tw-outline-none tw-flex tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out`}
    >
      <input
        id={type}
        type="radio"
        checked={isSelected}
        onChange={() => onChange(type)}
        className={`${inputClasses} tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-650 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-cursor-pointer`}
      />
      <div className="tw-flex tw-items-center tw-whitespace-nowrap tw-truncate">
        <div className="tw-flex tw-flex-col tw-text-md tw-font-semibold tw-truncate">
          {label ? <span className={labelClasses}>{label}</span> : children}
        </div>
      </div>
    </div>
  );
}
