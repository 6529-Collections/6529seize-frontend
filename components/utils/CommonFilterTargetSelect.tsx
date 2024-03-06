export enum FilterTargetType {
  ALL = "ALL",
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING",
}

const TARGETS = [
  { id: FilterTargetType.ALL, name: "All" },
  { id: FilterTargetType.OUTGOING, name: "Outgoing" },
  { id: FilterTargetType.INCOMING, name: "Incoming" },
];

export default function CommonFilterTargetSelect({
  selected,
  onChange,
}: {
  readonly selected: FilterTargetType;
  readonly onChange: (filter: FilterTargetType) => void;
}) {
  return (
    <fieldset className="tw-px-4 sm:tw-px-6 tw-mt-6 tw-max-w-sm">
      <div className="tw-flex tw-items-center tw-space-x-6 tw-space-y-0">
        {TARGETS.map((target) => (
          <button
            key={target.id}
            onClick={() => onChange(target.id)}
            className="tw-p-0 tw-flex tw-items-center tw-bg-iron-900 tw-border-none"
          >
            <input
              id={target.id}
              type="radio"
              checked={selected === target.id}
              onChange={() => onChange(target.id)}
              className="tw-form-radio tw-h-4 tw-w-4 tw-bg-iron-700 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
            />
            <label
              htmlFor={target.id}
              className="tw-ml-2 tw-block tw-text-sm sm:tw-text-md tw-font-medium tw-leading-6 tw-text-iron-300 tw-cursor-pointer"
            >
              {target.name}
            </label>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
