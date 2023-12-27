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
    <fieldset className="tw-px-6 md:tw-px-8 tw-mt-4 tw-max-w-sm">
      <div className="tw-flex tw-items-center tw-space-x-10 tw-space-y-0">
        {TARGETS.map((target) => (
          <button
            key={target.id}
            onClick={() => onChange(target.id)}
            className="tw-flex tw-items-center tw-bg-transparent tw-border-none"
          >
            <input
              id={target.id}
              type="radio"
              checked={selected === target.id}
              onChange={() => onChange(target.id)}
              className="tw-h-4 tw-w-4 tw-border-gray-300 tw-text-indigo-600 focus:tw-ring-indigo-600 tw-cursor-pointer"
            />
            <label
              htmlFor={target.id}
              className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-400 tw-cursor-pointer"
            >
              {target.name}
            </label>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
