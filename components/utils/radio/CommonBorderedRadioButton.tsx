export default function CommonBorderedRadioButton<T extends string>({
  type,
  selected,
  label,
  onChange,
}: {
  readonly type: T;
  readonly selected: T;
  readonly label: string;
  readonly onChange: (type: T) => void;
}) {
  const isSelected = selected === type;
  const wrapperClasses = isSelected
    ? "tw-ring-primary-400 tw-bg-[#222738]"
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
      className={`${wrapperClasses} tw-relative tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none tw-flex tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out`}
    >
      <input
        id={type}
        type="radio"
        checked={isSelected}
        onChange={() => onChange(type)}
        className={`${inputClasses} tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-cursor-pointer`}
      />
      <span className="tw-flex tw-items-center">
        <span className="tw-flex tw-flex-col tw-text-md">
          <span className={labelClasses}>{label}</span>
        </span>
      </span>
    </div>
  );
}
