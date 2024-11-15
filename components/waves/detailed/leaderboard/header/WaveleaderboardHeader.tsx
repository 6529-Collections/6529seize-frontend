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
  readonly onCreateDrop: () => void;
}

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  wave,
  sort,
  showMyDrops,
  setShowMyDrops,
  setSort,
  onCreateDrop,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  return (
    <div className="tw-mt-8 tw-flex tw-flex-col tw-gap-y-4">
      {connectedProfile && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-text-sm tw-text-iron-400">
              <span>My remaining: <span className="tw-text-iron-200">1,234 TDH</span></span>
            </div>
            <button
              className={`tw-group tw-border tw-border-solid tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
                showMyDrops
                  ? "tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-500/80 tw-border-primary-500 desktop-hover:hover:tw-border-primary-500/80"
                  : "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-white tw-border-transparent"
              }`}
              onClick={() => setShowMyDrops(!showMyDrops)}
            >
              <svg
                className={`tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-all tw-duration-300 tw-ease-out ${
                  showMyDrops ? "tw-text-white" : "tw-text-primary-300"
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
          </div>
          <button 
            onClick={onCreateDrop}
            className="tw-bg-primary-500 tw-text-white tw-border tw-border-primary-500 tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-primary-500/80 desktop-hover:hover:tw-border-primary-500/80"
          >
            <svg className="tw-w-4 tw-h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            Create Drop
          </button>
        </div>
      )}

      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-border-t tw-border-iron-700/40 tw-pb-4">
        <div>
          <h3 className="tw-text-2xl tw-font-semibold tw-text-iron-200 tw-mb-0">
            Leaderboard
          </h3>
          <p className="tw-text-sm tw-text-iron-400 tw-mb-0">
            Ranked by community votings
          </p>
        </div>
        <div className="tw-mt-4 sm:tw-mt-0">
          <WaveLeaderboardSort sort={sort} setSort={setSort} />
        </div>
      </div>
    </div>
  );
};
