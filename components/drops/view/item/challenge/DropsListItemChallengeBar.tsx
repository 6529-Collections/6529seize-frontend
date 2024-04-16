import DropListItemVotesTooltip from "../utils/DropListItemVotesTooltip";

export default function DropsListItemChallengeBar({
  current,
  maxValue,
  myRep,
}: {
  readonly current: number;
  readonly maxValue: number;
  readonly myRep: number | null;
}) {
  const width = (current / maxValue) * 100;
  return (
    <DropListItemVotesTooltip myVotes={myRep} current={current}>
      <div className="tw-relative tw-px-2">
        <div className="tw-absolute tw-flex tw-mx-2 tw-top-0 tw-inset-x-0 tw-h-1 tw-bg-iron-700 tw-rounded-full tw-overflow-hidden">
          <div
            className="tw-flex tw-flex-col tw-justify-center tw-overflow-hidden tw-bg-primary-500 tw-text-xs tw-text-white tw-text-center tw-whitespace-nowrap tw-transition tw-duration-500"
            style={{
              width: `${width}%`,
            }}
          ></div>
        </div>
      </div>
    </DropListItemVotesTooltip>
  );
}
