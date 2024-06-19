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
    ? "tw-ring-primary-400 tw-bg-[#202B45]"
    : "tw-ring-iron-700 tw-bg-iron-800 hover:tw-ring-iron-600";

  const inputClasses = isSelected
    ? "tw-text-primary-500 focus:tw-ring-primary-500"
    : "tw-text-primary-400 focus:tw-ring-primary-400";

  const labelClasses = isSelected
    ? "tw-font-bold tw-text-primary-400"
    : "tw-font-semibold tw-text-iron-300";
  return (
    <div
      onClick={() => onChange(type)}
      className={`${wrapperClasses} tw-min-w-[180px] tw-relative tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-px-5 tw-py-4 tw-shadow-xl focus:tw-outline-none tw-flex tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out`}
    >
      <input
        id={type}
        type="radio"
        checked={isSelected}
        onChange={() => onChange(type)}
        className={`${inputClasses} tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-cursor-pointer`}
      />
      <div className="tw-flex tw-items-center">
        <span className="tw-flex tw-flex-col tw-text-base">
          {label ? <span className={labelClasses}>{label}</span> : children}
        </span>
      </div>
    </div>
  );
}
