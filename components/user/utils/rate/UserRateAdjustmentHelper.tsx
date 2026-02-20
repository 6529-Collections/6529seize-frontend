import UserRateAdjustmentHelperValue from "./UserRateAdjustmentHelperValue";

export default function UserRateAdjustmentHelper({
  inLineValues,
  originalValue,
  adjustedValue,
  adjustmentType,
  labelClassName,
}: {
  readonly inLineValues: boolean;
  readonly originalValue: number;
  readonly adjustedValue: number;
  readonly adjustmentType: string;
  readonly labelClassName?: string;
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
        labelClassName={labelClassName}
      />
      <UserRateAdjustmentHelperValue
        value={adjustedValue - originalValue}
        title="Adjustment:"
        labelClassName={labelClassName}
      />
    </div>
  );
}
