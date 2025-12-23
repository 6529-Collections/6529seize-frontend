import React from "react";
import { TrophyIcon } from "@heroicons/react/24/outline";

export const WaveWinnersEmpty: React.FC = () => {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-py-16 tw-px-4">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-max-w-xs tw-text-center">
        <TrophyIcon className="tw-size-10 tw-text-iron-600" />
        <div className="tw-space-y-1.5">
          <p className="tw-text-base tw-font-medium tw-text-iron-300">
            No Winners Yet
          </p>
          <p className="tw-text-sm tw-text-iron-500">
            No winners have been announced for this wave yet. Check back later!
          </p>
        </div>
      </div>
    </div>
  );
};
