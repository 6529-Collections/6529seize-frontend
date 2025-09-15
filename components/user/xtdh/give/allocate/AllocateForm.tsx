"use client";

export default function AllocateForm({
  amountPerDay,
  onAmountChange,
  onReset,
  onSubmit,
  disabled,
  helpers,
}: {
  readonly amountPerDay: string;
  readonly onAmountChange: (v: string) => void;
  readonly onReset: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly disabled: boolean;
  readonly helpers?: string[];
}) {
  return (
    <form className="tw-flex tw-flex-col tw-gap-3" onSubmit={onSubmit}>
      <label className="tw-text-iron-200 tw-text-sm">Allocation (TDH Rate / day)</label>
      <input
        value={amountPerDay}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="e.g. 0.25"
        className="\
          tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700\
          tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-border-primary-500"
      />
      <div className="tw-flex tw-gap-2 tw-justify-end tw-pt-2">
        <button
          type="button"
          className="\
            tw-bg-iron-800 tw-text-iron-200 tw-rounded tw-px-3 tw-py-2\
            tw-border tw-border-iron-700 hover:tw-bg-iron-700 tw-transition"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="submit"
          className="tw-bg-primary-600 tw-text-white tw-rounded tw-px-4 tw-py-2 hover:tw-bg-primary-500 tw-transition"
          disabled={disabled}
          title={disabled ? "Pick a target first" : undefined}
        >
          Allocate
        </button>
      </div>
      <div className="tw-text-iron-400 tw-text-xs">
        {helpers?.length ? (
          <ul className="tw-list-disc tw-pl-5 tw-space-y-1">
            {helpers.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : (
          <span>Distribution rules (721/1155/traits/fungible) and effective timing will be added here.</span>
        )}
      </div>
    </form>
  );
}

