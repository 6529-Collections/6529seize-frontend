import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import DropListItemVotesTooltip from "../../utils/DropListItemVotesTooltip";

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

  const getRepColor = (rep: number) => {
    if (rep > 0) {
      return positiveRepColor;
    }
    if (rep < 0) {
      return negativeRepColor;
    }
    return neutralRepColor;
  };

  const userRepColor = getRepColor(userRep);
  const totalRepColor = getRepColor(totalRep);
  return (
    <DropListItemVotesTooltip myVotes={userRep} current={totalRep}>
      <div className="tw-hidden tw-min-w-[42px] tw-inline-flex tw-justify-center tw-text-center tw-absolute tw-right-5 tw-top-5">
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
    </DropListItemVotesTooltip>
  );
}
