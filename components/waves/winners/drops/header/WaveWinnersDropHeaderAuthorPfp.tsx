import React from "react";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropHeaderAuthorPfpProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderAuthorPfp({
  winner,
}: WaveWinnersDropHeaderAuthorPfpProps) {
  return (
    <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
      {winner.drop.author.pfp ? (
        <div className="tw-rounded-lg tw-h-full tw-w-full">
          <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
            <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
              <img
                src={winner.drop.author.pfp}
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
}
