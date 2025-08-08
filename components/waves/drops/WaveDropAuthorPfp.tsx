import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ProfileWinnerRing } from "./ProfileWinnerRing";

interface WaveDropAuthorPfpProps {
  readonly drop: ApiDrop;
}

const WaveDropAuthorPfp: React.FC<WaveDropAuthorPfpProps> = ({ drop }) => {
  // MOCK DATA - TODO: Replace with real winner_main_stage_drop_ids when available
  const getMockWinnerData = (userId: string) => {
    if (!userId) return { winCount: 0, bestRank: 1 };
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const patterns = [
      { winCount: 1, bestRank: 1 }, // Gold single winner
      { winCount: 3, bestRank: 1 }, // Gold multiple winner
      { winCount: 1, bestRank: 2 }, // Silver single winner
      { winCount: 2, bestRank: 2 }, // Silver multiple winner
      { winCount: 1, bestRank: 3 }, // Bronze single winner
      { winCount: 5, bestRank: 1 }, // Gold heavy winner
      { winCount: 7, bestRank: 1 }, // Gold super winner
    ];
    const patternIndex = hash % patterns.length;
    return patterns[patternIndex];
  };

  const mockWinnerData = getMockWinnerData(drop.author.id);

  return (
    <ProfileWinnerRing 
      winCount={mockWinnerData.winCount} 
      bestRank={mockWinnerData.bestRank}
      size="small"
    >
      <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
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
    </ProfileWinnerRing>
  );
};

export default WaveDropAuthorPfp;