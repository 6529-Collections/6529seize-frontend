import React from 'react';
import { Drop } from '../../../../generated/models/Drop';

interface WaveDetailedDropRatingsProps {
  readonly drop: Drop;
}

const WaveDetailedDropRatings: React.FC<WaveDetailedDropRatingsProps> = ({ drop }) => {
  return (
    <div className="tw-flex tw-justify-end">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center -tw-space-x-2">
          <img
            src=""
            alt=""
            className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-700"
          />
        </div>
        <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
          {drop.raters_count} raters
        </span>
        <div className="tw-h-1 tw-w-1 tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
        <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
          {drop.rating} ratings
        </span>
      </div>
    </div>
  );
};

export default WaveDetailedDropRatings;