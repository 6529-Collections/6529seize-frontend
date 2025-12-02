import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function UserPageXtdhGrantAmount({
  amount,
  onAmountChange,
  maxGrantRate,
  isMaxGrantLoading,
  isMaxGrantError,
}: {
  readonly amount: number | null;
  readonly onAmountChange: (value: number | null) => void;
  readonly maxGrantRate: number | null;
  readonly isMaxGrantLoading: boolean;
  readonly isMaxGrantError: boolean;
}) {
  const formattedMax =
    maxGrantRate !== null && Number.isFinite(maxGrantRate)
      ? formatNumberWithCommas(Number(maxGrantRate.toFixed(1)))
      : null;

  let maxGrantMessage;
  if (isMaxGrantLoading) {
    maxGrantMessage = (
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-animate-pulse">
        <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-iron-500" aria-hidden />
        {" "}Fetching max available…
      </span>
    );
  } else if (isMaxGrantError || maxGrantRate === null) {
    maxGrantMessage = (
      <span className="tw-text-iron-400">Unable to load your max available grant amount.</span>
    );
  } else {
    maxGrantMessage = (
      <span className="tw-text-iron-200">
        Max available: {formattedMax} xTDH/day
      </span>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <label
        htmlFor="xtdh-grant-amount"
        className="tw-text-sm tw-font-medium tw-text-iron-100">
        Total amount
      </label>
      <input
        id="xtdh-grant-amount"
        aria-describedby="xtdh-grant-status"
        type="number"
        min="0"
        max={maxGrantRate ?? undefined}
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
          if (!Number.isFinite(parsedValue) || parsedValue < 0) {
            onAmountChange(null);
            return;
          }

          onAmountChange(parsedValue);
        }}
        className="tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
      />
      <p id="xtdh-grant-status" className="tw-text-xs tw-font-medium tw-text-iron-300">
        {maxGrantMessage}
      </p>
    </div>
  );
}
