import React from "react";

const TimelineItemSkeleton = () => (
  <div className="tw-relative tw-flex tw-gap-4 tw-pb-8">
    {/* Timeline dot and line */}
    <div className="tw-flex tw-flex-col tw-items-center">
      <div className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-iron-700 tw-animate-pulse" />
      <div className="tw-w-0.5 tw-flex-1 tw-bg-iron-800 tw-mt-2" />
    </div>
    {/* Content */}
    <div className="tw-flex-1 tw-pb-4">
      <div className="tw-w-32 tw-h-4 tw-mb-3 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
      <div className="tw-space-y-2">
        <div className="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-xl tw-bg-iron-900/50 tw-border tw-border-iron-800/40">
          <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
          <div className="tw-flex-1">
            <div className="tw-w-24 tw-h-3 tw-mb-2 tw-rounded tw-bg-iron-800/80 tw-animate-pulse" />
            <div className="tw-w-16 tw-h-3 tw-rounded tw-bg-iron-800/80 tw-animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const WaveWinnersTimelineLoading: React.FC = () => {
  return (
    <div className="tw-p-4">
      <TimelineItemSkeleton />
      <TimelineItemSkeleton />
      <TimelineItemSkeleton />
    </div>
  );
};
