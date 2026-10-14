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
      <span className="tw-inline-flex tw-animate-pulse tw-items-center tw-gap-1">
        <span
          className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-iron-500"
          aria-hidden
        />{" "}
        Fetching max available…
      </span>
    );
  } else if (isMaxGrantError || maxGrantRate === null) {
    maxGrantMessage = (
      <span className="tw-text-iron-400">
        Unable to load your max available grant amount.
      </span>
    );
  } else {
    maxGrantMessage = (
      <span>Max available: {formattedMax} xTDH/day</span>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <label
        htmlFor="xtdh-grant-amount"
        className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500"
      >
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
        className="tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-[16px] tw-font-normal tw-tabular-nums tw-text-iron-100 md:desktop-hover:tw-text-[14px] tw-ring-1 tw-ring-inset tw-ring-white/[0.06] focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
      />
      <p
        id="xtdh-grant-status"
        className="tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500"
      >
        {maxGrantMessage}
      </p>
    </div>
  );
}
