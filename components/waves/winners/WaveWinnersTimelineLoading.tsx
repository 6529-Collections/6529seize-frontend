import React from "react";

export const WaveWinnersTimelineLoading: React.FC = () => {
  const renderLoadingItem = (index: number) => (
    <div key={index} className="tw-relative">
      {/* Timeline connector dot */}
      <div className="tw-absolute tw-left-0.5 lg:tw-left-[19px] tw-top-0">
        <div className="tw-size-4 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-animate-pulse">
          <div className="tw-rounded-full tw-bg-iron-600 tw-size-2.5"></div>
        </div>
      </div>

      {/* Combined header skeleton */}
      <div className="tw-ml-6 lg:tw-ml-10 tw-mb-2 lg:tw-mb-3">
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1">
          <div className="tw-h-5 tw-w-28 tw-bg-iron-800 tw-rounded-md tw-animate-pulse"></div>
          <div className="tw-h-6 tw-w-20 tw-bg-iron-800 tw-rounded-md tw-animate-pulse"></div>
          <div className="tw-h-4 tw-w-16 tw-bg-iron-800 tw-rounded-md tw-animate-pulse"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="tw-ml-6 lg:tw-ml-10">
        <div className="tw-rounded-lg tw-border-l-2 tw-border-iron-600/40 tw-border-y-0 tw-border-r-0">
          <div className="lg:tw-px-4 tw-pb-4">
            <div className="tw-h-40 tw-bg-iron-800 tw-rounded-lg tw-animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tw-pt-2 lg:tw-pt-4 tw-pb-4 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
      <div className="tw-relative">
        {/* Timeline vertical line */}
        <div className="tw-absolute tw-left-2.5 sm:tw-left-[19px] tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-700/80 tw-backdrop-blur-sm"></div>
        {/* Timeline glow effect */}
        <div className="tw-absolute tw-left-2.5 sm:tw-left-[18px] tw-top-0 tw-bottom-0 tw-w-[3px] tw-bg-gradient-to-b tw-from-iron-900 tw-via-iron-700/20 tw-to-iron-900 tw-opacity-40 tw-blur-sm"></div>
        
        <div className="tw-space-y-8">
          {/* Skeleton loaders for timeline items */}
          {[1, 2, 3].map((index) => renderLoadingItem(index))}
        </div>
      </div>
    </div>
  );
};