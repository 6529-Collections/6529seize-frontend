export default function UserPageXtdhGrantAmount({
  amount,
  onAmountChange,
}: {
  readonly amount: number | null;
  readonly onAmountChange: (value: number | null) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <label
        htmlFor="xtdh-grant-amount"
        className="tw-text-sm tw-font-medium tw-text-iron-100">
        Total amount
      </label>
      <input
        id="xtdh-grant-amount"
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        placeholder="Enter total xTDH amount"
        value={amount === null ? "" : String(amount)}
        onChange={(event) => {
          const { value } = event.target;
          if (value === "") {
            onAmountChange(null);
            return;
          }

          const parsedValue = Number(value);
          onAmountChange(Number.isNaN(parsedValue) ? null : parsedValue);
        }}
        className="tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
      />
    </div>
  );
}
