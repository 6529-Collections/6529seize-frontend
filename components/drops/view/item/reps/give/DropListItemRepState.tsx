import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export default function DropListItemRepState({
  userRep,
  totalRep,
}: {
  readonly userRep: number;
  readonly totalRep: number;
}) {
  const positiveRepColor = "tw-text-green";
  const neutralRepColor = "tw-text-iron-400";
  const negativeRepColor = "tw-text-red";
  const userRepColor =
    userRep > 0
      ? positiveRepColor
      : userRep < 0
      ? negativeRepColor
      : neutralRepColor;
  const totalRepColor =
    totalRep > 0
      ? positiveRepColor
      : totalRep < 0
      ? negativeRepColor
      : neutralRepColor;
  return (
    <div className="tw-min-w-[42px] tw-inline-flex tw-justify-center tw-text-center tw-absolute tw-right-5 tw-top-5">
      {!!userRep && (
        <>
          <div
            className={`${userRepColor} tw-whitespace-nowrap tw-text-xs tw-font-medium`}
          >
            {userRep}
          </div>
          <div className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
            /
          </div>
        </>
      )}

      <div
        className={`${totalRepColor} tw-whitespace-nowrap tw-text-xs tw-font-medium`}
      >
        {formatNumberWithCommas(totalRep)}
      </div>
    </div>
  );
}
