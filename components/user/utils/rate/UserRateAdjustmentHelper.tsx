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
          ? "tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2"
          : "tw-mx-auto tw-mb-4 tw-grid tw-max-w-[16rem] tw-grid-cols-2 tw-gap-4"
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
