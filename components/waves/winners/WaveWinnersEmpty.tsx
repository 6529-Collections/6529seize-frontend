import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";

export const WaveWinnersEmpty: React.FC = () => {
  return (
    <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-none">
      <div className="tw-p-6 tw-text-center tw-bg-iron-900 tw-rounded-lg tw-border tw-border-iron-800">
        <div className="tw-h-14 tw-w-14 tw-mx-auto tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-bg-iron-800/80 tw-mb-4">
          <FontAwesomeIcon
            icon={faTrophy}
            className="tw-h-7 tw-w-7 tw-text-iron-400"
          />
        </div>
        <p className="tw-text-lg tw-font-semibold tw-text-iron-300">
          No Winners Yet
        </p>
        <p className="tw-text-sm tw-text-iron-400 tw-mt-2">
          No winners have been announced for this wave yet. Check back later!
        </p>
      </div>
    </div>
  );
};
