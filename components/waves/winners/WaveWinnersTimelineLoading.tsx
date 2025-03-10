import React from "react";

export const WaveWinnersTimelineLoading: React.FC = () => {
  const renderLoadingNode = (index: number) => (
    <div key={index} className="tw-relative">
      {/* Timeline connector dot */}
      <div className="tw-absolute tw-left-[-32px] tw-top-2.5">
        <div className="tw-size-4 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-animate-pulse">
          <div className="tw-size-2 tw-rounded-full tw-bg-iron-700"></div>
        </div>
      </div>
      
      {/* Node content */}
      <div className="tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-border-l-2 tw-border-iron-800/40 tw-border-y-0 tw-border-r-0">
        <div className="tw-px-5 tw-py-3">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-h-5 tw-w-32 tw-bg-iron-800 tw-rounded-md tw-animate-pulse"></div>
            <div className="tw-h-4 tw-w-16 tw-bg-iron-800 tw-rounded-md tw-animate-pulse"></div>
          </div>
          
          <div className="tw-mt-1.5">
            <div className="tw-h-4 tw-w-20 tw-bg-iron-800 tw-rounded-md tw-animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tw-px-4 tw-py-2 tw-mt-2 tw-bg-black">
      <div className="tw-relative">
        {/* Timeline vertical line */}
        <div className="tw-absolute tw-left-[19px] tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-700/80 tw-backdrop-blur-sm"></div>
        {/* Timeline glow effect */}
        <div className="tw-absolute tw-left-[18px] tw-top-0 tw-bottom-0 tw-w-[3px] tw-bg-gradient-to-b tw-from-iron-900 tw-via-iron-700/20 tw-to-iron-900 tw-opacity-40 tw-blur-sm"></div>
        
        <div className="tw-space-y-8">
          {/* Date headers with loading nodes */}
          {[1, 2].map((dateGroup) => (
            <div key={dateGroup} className="tw-relative">
              {/* Date header loading */}
              <div className="tw-mb-4 tw-flex tw-items-center">
                <div className="tw-size-2.5 tw-rounded-full tw-bg-iron-600/80 tw-mr-4 tw-animate-pulse"></div>
                <div className="tw-h-4 tw-w-36 tw-bg-iron-800/80 tw-rounded-md tw-animate-pulse"></div>
              </div>
              
              <div className="tw-space-y-6 tw-ml-10">
                {Array.from({ length: dateGroup === 1 ? 3 : 2 }).map((_, i) => renderLoadingNode(i))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};