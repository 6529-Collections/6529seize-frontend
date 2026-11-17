import UserRateAdjustmentHelperValue from "./UserRateAdjustmentHelperValue";

export default function UserRateAdjustmentHelper({
  inLineValues,
  originalValue,
  adjustedValue,
  adjustmentType,
  valueLayout = "stacked",
  variant = "default",
}: {
  readonly inLineValues: boolean;
  readonly originalValue: number;
  readonly adjustedValue: number;
  readonly adjustmentType: string;
  readonly valueLayout?: "stacked" | "inline";
  readonly variant?: "default" | "summary";
}) {
  let containerClassName = inLineValues
    ? "tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2"
    : "tw-mb-4 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2";
  if (variant === "summary") {
    containerClassName =
      "tw-mt-3 tw-flex tw-items-baseline tw-justify-between tw-gap-3";
  }
  return (
    <div className={containerClassName}>
      <UserRateAdjustmentHelperValue
        layout={valueLayout}
        variant={variant === "summary" ? "current" : "default"}
        value={originalValue}
        title={`Current ${adjustmentType}:`}
      />
      <UserRateAdjustmentHelperValue
        layout={valueLayout}
        variant={variant === "summary" ? "adjustment" : "default"}
        value={adjustedValue - originalValue}
        title="Adjustment:"
      />
    </div>
  );
}
