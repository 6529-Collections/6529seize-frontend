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
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-1 tw-text-xs tw-text-iron-400">
        <span>Resetting votes...</span>
        <span className="tw-font-medium">
          {resetProgress} / {totalCount}
        </span>
      </div>
      <div className="tw-h-1 tw-w-full tw-bg-iron-800 tw-rounded-full tw-overflow-hidden">
        <div
          className="tw-h-full tw-bg-primary-500 tw-rounded-full tw-transition-all tw-duration-200 tw-ease-out"
          style={{
            width: `${(resetProgress / totalCount) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default MyStreamWaveMyVotesResetProgress;
