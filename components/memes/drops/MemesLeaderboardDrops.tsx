import React, { useContext } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveDropsLeaderboard, WaveDropsLeaderboardSortBy, WaveDropsLeaderboardSortDirection } from "../../../hooks/useWaveDropsLeaderboard";
import MemesLeaderboardDrop from "./MemesLeaderboardDrop";
import { AuthContext } from "../../auth/Auth";

interface MemesLeaderboardDropsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const MemesLeaderboardDrops: React.FC<MemesLeaderboardDropsProps> = ({
  wave,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  
  const {
    drops,
    isLoading,
    isError,
  } = useWaveDropsLeaderboard({
    waveId: wave.id,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: true,
    dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
    sortDirection: WaveDropsLeaderboardSortDirection.DESC,
  });

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
          <div className="tw-animate-spin">
            <svg
              className="tw-w-8 tw-h-8 tw-text-iron-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="tw-opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="tw-opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div className="tw-text-iron-400">Loading artwork submissions...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
        <div className="tw-text-iron-400">
          Error loading artwork submissions. Please try again.
        </div>
      </div>
    );
  }

  if (!drops || drops.length === 0) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-12 tw-px-4">
        <div className="tw-text-center">
          <svg
            className="tw-w-12 tw-h-12 tw-mx-auto tw-mb-4 tw-text-iron-700"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.5 21C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5Z"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 16.5L8.25 11.25C8.66421 10.8358 9.33579 10.8358 9.75 11.25L15 16.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.25 15.75L15.75 14.25C16.1642 13.8358 16.8358 13.8358 17.25 14.25L21 18"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-text-iron-300 tw-font-medium tw-mb-1">
            No artwork submissions yet
          </div>
          <div className="tw-text-iron-500 tw-text-sm">
            Be the first to submit your artwork to The Memes collection
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-6 tw-pb-8">
      {drops.map((drop) => (
        <MemesLeaderboardDrop
          key={drop.id}
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
        />
      ))}
    </div>
  );
};

export default MemesLeaderboardDrops;