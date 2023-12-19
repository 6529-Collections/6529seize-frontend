import { formatNumberWithCommas } from "../../../../../helpers/Helpers";

export default function ProfileActivityLogRateColoredValue({
  value,
}: {
  readonly value: number;
}) {
  const isPositive = value > 0;
  const valueAsStr = `${isPositive ? "+" : ""}${formatNumberWithCommas(value)}`;
  return (
    <span
      className={`${
        isPositive ? "tw-text-green" : "tw-text-red"
      } tw-text-sm tw-font-semibold`}
    >
      {valueAsStr}
    </span>
  );
}
