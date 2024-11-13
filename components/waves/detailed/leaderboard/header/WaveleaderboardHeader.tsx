import React, { useContext } from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { WaveLeaderboardSort } from "./WaveLeaderboardSort";
import { WaveLeaderboardSortType } from "../WaveLeaderboard";
import { AuthContext } from "../../../../auth/Auth";

interface WaveLeaderboardHeaderProps {
  readonly wave: ApiWave;
  readonly sort: WaveLeaderboardSortType;
  readonly showMyDrops: boolean;
  readonly setShowMyDrops: (show: boolean) => void;
  readonly setSort: (sort: WaveLeaderboardSortType) => void;
}

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  wave,
  sort,
  showMyDrops,
  setShowMyDrops,
  setSort,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  return (
    <div className="tw-mt-8 tw-flex tw-items-center tw-justify-between tw-mb-6">
      <div>
        <h3 className="tw-text-2xl tw-font-medium tw-text-iron-50 tw-mb-1">
          Leaderboard
        </h3>
        <p className="tw-text-sm tw-text-iron-400 tw-mb-0">
          Ranked by community ratings
        </p>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-4">
        {connectedProfile && (
          <button
            className={`tw-group tw-border-0 tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg ${
              showMyDrops
                ? "tw-bg-iron-800/60 tw-text-white"
                : "tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800/60 hover:tw-text-white"
            }`}
            onClick={() => setShowMyDrops(!showMyDrops)}
          >
            <svg
              className={`tw-w-4 tw-h-4 tw-flex-shrink-0 ${
                showMyDrops
                  ? "tw-text-blue-300"
                  : "tw-text-blue-400 group-hover:tw-text-blue-300"
              }`}
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            My Drops
          </button>
        )}
        <WaveLeaderboardSort sort={sort} setSort={setSort} />
      </div>
    </div>
  );
};
