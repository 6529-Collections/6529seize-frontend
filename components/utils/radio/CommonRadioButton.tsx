import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

export default function CommonRadioButton<T>({
  value,
  label,
  selected,
  setSelected,
}: {
  readonly value: T;
  readonly label: string;
  readonly selected: T;
  readonly setSelected: (value: T) => void;
}) {
  const id = getRandomObjectId();
  return (
    <button
      onClick={() => setSelected(value)}
      className="tw-p-0 tw-flex tw-items-center tw-bg-iron-900 tw-border-none"
    >
      <input
        id={id}
        type="radio"
        checked={selected === value}
        onChange={() => setSelected(value)}
        className="tw-form-radio tw-h-4 tw-w-4 tw-bg-iron-700 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
      />
      <label
        htmlFor={id}
        className="tw-ml-2 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-300 tw-cursor-pointer"
      >
        {label}
      </label>
    </button>
  );
}
