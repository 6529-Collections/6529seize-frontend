import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface WaveDropAuthorPfpProps {
  readonly drop: ApiDrop;
}

const WaveDropAuthorPfp: React.FC<WaveDropAuthorPfpProps> = ({ drop }) => {
  // Check if this drop author has any main stage winner drop IDs
  const isFirstPlace = drop.author.winner_main_stage_drop_ids && 
                       drop.author.winner_main_stage_drop_ids.length > 0;
  const shadowClass = isFirstPlace ? "tw-shadow-[0_1px_4px_rgba(251,191,36,0.15)]" : "";

  return (
    <div className={`tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg ${shadowClass}`}>
      {drop.author.pfp ? (
        <div className="tw-rounded-lg tw-h-full tw-w-full">
          <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
            <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
              <img
                src={drop.author.pfp}
                alt="Profile picture"
                className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-lg"></div>
      )}
    </div>
  );
};

export default WaveDropAuthorPfp;