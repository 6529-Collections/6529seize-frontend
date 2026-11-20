import React from "react";

interface MyStreamWaveMyVotesResetProgressProps {
  readonly isResetting: boolean;
  readonly resetProgress: number;
  readonly totalCount: number;
}

const MyStreamWaveMyVotesResetProgress: React.FC<
  MyStreamWaveMyVotesResetProgressProps
> = ({ isResetting, resetProgress, totalCount }) => {
  if (!isResetting) return null;

  return (
    <div className="tw-mt-3 tw-px-0.5">
      <div className="tw-mb-1 tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-iron-400">
        <span>Resetting votes...</span>
        <span className="tw-font-medium !tw-tabular-nums">
          {resetProgress} / {totalCount}
        </span>
      </div>
      <div className="tw-h-1 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
        <div
          className="tw-h-full tw-rounded-full tw-bg-primary-500 tw-transition-all tw-duration-200 tw-ease-out"
          style={{
            width: `${(resetProgress / totalCount) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default MyStreamWaveMyVotesResetProgress;
