import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import ProfileActivityLogItemAction from "../utils/ProfileActivityLogItemAction";
import ProfileActivityLogRateColoredValue from "./ProfileActivityLogRateColoredValue";

export default function ProfileActivityLogRateChange({
  oldValue,
  newValue,
}: {
  readonly oldValue: number;
  readonly newValue: number;
}) {
  const change = newValue - oldValue;
  const isChangePositive = change > 0;
  const changeAsString = `${
    isChangePositive ? "+" : ""
  }${formatNumberWithCommas(change)}`;
  return (
    <>
      <ProfileActivityLogItemAction action={`cic-rating to`} />
      <ProfileActivityLogRateColoredValue value={newValue} />

      <span className="tw-whitespace-nowrap tw-text-xs tw-text-iron-400 tw-font-thin">
        (change {changeAsString})
      </span>
    </>
  );
}
