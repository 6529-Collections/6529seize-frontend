import { formatNumberWithCommas } from "../../../../../helpers/Helpers";

export default function ProfileActivityLogRateRemove({
  value,
}: {
  readonly value: number;
}) {
  const isPositive = value > 0;
  const valueAsStr = `${isPositive ? "+" : ""}${formatNumberWithCommas(value)}`;
  return (
    <span className="tw-whitespace-nowrap tw-text-xs tw-text-iron-400 tw-font-thin">
      ({valueAsStr})
    </span>
  );
}
