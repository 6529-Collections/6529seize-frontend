import UserRateAdjustmentHelperValue from "./UserRateAdjustmentHelperValue";

export default function UserRateAdjustmentHelper({
  inLineValues,
  originalValue,
  adjustedValue,
  adjustmentType,
}: {
  readonly inLineValues: boolean;
  readonly originalValue: number;
  readonly adjustedValue: number;
  readonly adjustmentType: string;
}) {
  return (
    <div
      className={`${
        inLineValues
          ? "tw-mt-2 tw-flex tw-flex-wrap tw-gap-y-1 tw-gap-x-4"
          : "tw-grid tw-grid-cols-2 tw-gap-2 tw-mb-4"
      } `}
    >
      <UserRateAdjustmentHelperValue
        value={originalValue}
        title={`Current ${adjustmentType}:`}
      />
      <UserRateAdjustmentHelperValue
        value={adjustedValue - originalValue}
        title="Adjustment:"
      />
    </div>
  );
}
