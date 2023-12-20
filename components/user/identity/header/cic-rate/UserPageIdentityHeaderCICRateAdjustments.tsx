import UserPageIdentityHeaderCICRateAdjustmentsValue from "./UserPageIdentityHeaderCICRateAdjustmentsValue";

export default function UserPageIdentityHeaderCICRateAdjustments({
  isTooltip,
  originalValue,
  adjustedValue,
}: {
  readonly isTooltip: boolean;
  readonly originalValue: number;
  readonly adjustedValue: number;
}) {
  return (
    <div
      className={`${
        isTooltip
          ? "tw-mt-2 tw-flex tw-flex-wrap tw-gap-y-1 tw-gap-x-4"
          : "tw-mt-2 md:tw-mt-0 tw-space-y-1 md:-tw-space-y-1 tw-flex tw-flex-col"
      } `}
    >
      <UserPageIdentityHeaderCICRateAdjustmentsValue
        value={originalValue}
        title="Current CIC:"
      />
      <UserPageIdentityHeaderCICRateAdjustmentsValue
        value={adjustedValue - originalValue}
        title="Adjustment:"
      />
    </div>
  );
}
