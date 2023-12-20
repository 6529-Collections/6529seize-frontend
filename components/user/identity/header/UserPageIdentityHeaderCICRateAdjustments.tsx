export default function UserPageIdentityHeaderCICRateAdjustments({isTooltip}:{isTooltip: boolean}) {
  return (
    <div
      className={`${
        isTooltip
          ? "tw-mt-2 tw-flex tw-flex-wrap tw-gap-y-1 tw-gap-x-4"
          : "tw-mt-2 md:tw-mt-0 tw-space-y-1 md:-tw-space-y-1 tw-flex tw-flex-col"
      } `}
    >
      <div className="tw-space-x-1.5">
        <span className="tw-text-sm tw-text-iron-200 tw-font-medium">
          Current:
        </span>
        <span className="tw-text-green tw-text-sm tw-font-semibold">
          +70000
        </span>
      </div>
      <div className="tw-space-x-1.5">
        <span className="tw-text-sm tw-text-iron-200 tw-font-medium">
          Adjustment:
        </span>
        <span className="tw-text-red tw-text-sm tw-font-semibold">-1288</span>
      </div>
    </div>
  );
}
