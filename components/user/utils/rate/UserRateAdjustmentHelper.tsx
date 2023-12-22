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
          : "tw-mt-2 md:tw-mt-0 tw-space-y-1 md:-tw-space-y-1 tw-flex tw-flex-col"
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
