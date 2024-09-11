import React from 'react';
import { Drop } from '../../../../generated/models/Drop';

interface WaveDetailedDropAuthorPfpProps {
  drop: Drop;
}

const WaveDetailedDropAuthorPfp: React.FC<WaveDetailedDropAuthorPfpProps> = ({ drop }) => {
  return (
    <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
      {drop.author.pfp ? (
        <img
          src={drop.author.pfp}
          alt="Profile picture"
          className="tw-h-full tw-w-full tw-object-cover tw-rounded-lg"
        />
      ) : (
        <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-rounded-lg"></div>
      )}
    </div>
  );
};

export default WaveDetailedDropAuthorPfp;