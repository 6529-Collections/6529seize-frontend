import React from 'react';

interface WaveDetailedDropPartOverflowProps {
  isOverflowing: boolean;
  showMore: boolean;
  setShowMore: (show: boolean) => void;
}

const WaveDetailedDropPartOverflow: React.FC<WaveDetailedDropPartOverflowProps> = ({
  isOverflowing,
  showMore,
  setShowMore
}) => {
  if (!isOverflowing || showMore) return null;

  return (
    <div className="tw-bg-gradient-to-t tw-from-iron-900 tw-h-48 tw-absolute tw-inset-x-0 tw-bottom-0">
      <div className="tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-end">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMore(true);
            }}
            type="button"
            className="tw-relative tw-shadow tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-700 tw-px-2 tw-py-1.5 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
          >
            Show full drop
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDropPartOverflow;