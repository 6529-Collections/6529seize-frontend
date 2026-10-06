import UserRateAdjustmentHelperValue from "./UserRateAdjustmentHelperValue";

export default function UserRateAdjustmentHelper({
  inLineValues,
  originalValue,
  adjustedValue,
  adjustmentType,
  valueLayout = "stacked",
}: {
  readonly inLineValues: boolean;
  readonly originalValue: number;
  readonly adjustedValue: number;
  readonly adjustmentType: string;
  readonly valueLayout?: "stacked" | "inline";
}) {
  return (
    <div
      className={`${
        inLineValues
          ? "tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2"
          : "tw-mb-4 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2"
      } `}
    >
      <UserRateAdjustmentHelperValue
        layout={valueLayout}
        value={originalValue}
        title={`Current ${adjustmentType}:`}
      />
      <UserRateAdjustmentHelperValue
        layout={valueLayout}
        value={adjustedValue - originalValue}
        title="Adjustment:"
      />
    </div>
  );
}
