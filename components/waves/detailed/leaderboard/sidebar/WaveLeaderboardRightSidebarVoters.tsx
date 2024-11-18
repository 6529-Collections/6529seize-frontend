import React from "react";
import { ApiWave } from "../../../../../generated/models/ObjectSerializer";
import { useAuth } from "../../../../auth/Auth";
import { useWaveTopVoters } from "../../../../../hooks/useWaveTopVoters";
import { useIntersectionObserver } from "../../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardRightSidebarVoter } from "./WaveLeaderboardRightSidebarVoter";

interface WaveLeaderboardRightSidebarVotersProps {
  readonly wave: ApiWave;
}

export const WaveLeaderboardRightSidebarVoters: React.FC<
  WaveLeaderboardRightSidebarVotersProps
> = ({ wave }) => {
  const { connectedProfile } = useAuth();
  const { voters, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useWaveTopVoters({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: false,
      dropId: null,
      sortDirection: "DESC",
      sort: "ABSOLUTE",
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div className="tw-space-y-2">
      {voters.length === 0 && !isFetching ? (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-mt-10 tw-space-y-6 tw-text-iron-400">
          <div className="tw-relative tw-group">
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-primary-400/30 tw-via-indigo-500/20 tw-to-iron-800/20 tw-rounded-full tw-animate-[spin_4s_linear_infinite] group-hover:tw-from-primary-400/40"></div>
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-iron-800/20 tw-via-indigo-500/20 tw-to-primary-400/30 tw-rounded-full tw-animate-[spin_5s_linear_infinite] group-hover:tw-to-primary-400/40"></div>
            <svg
              className="tw-size-10 tw-flex-shrink-0 tw-relative hover:tw-scale-110 tw-transition-all tw-duration-500 tw-animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.7 13.5L20.7005 11.5L18.7 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909M12 7V12L15 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="tw-opacity-90"
              />
            </svg>
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-animate-[fadeIn_1s_ease-in] hover:tw-scale-105 tw-transition-transform tw-duration-300">
            <span className="tw-text-lg tw-font-semibold tw-bg-gradient-to-br tw-from-iron-200 tw-via-iron-300 tw-to-iron-400 tw-bg-clip-text tw-text-transparent">
              Be the First to Make a Vote
            </span>
            <p className="tw-text-sm tw-text-iron-500 tw-text-center tw-max-w-xs">
              Vote on drops to see voter rankings appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {voters.map((voter, index) => (
            <WaveLeaderboardRightSidebarVoter
              voter={voter}
              key={voter.voter.id}
              position={index + 1}
            />
          ))}
          {isFetchingNextPage && (
            <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
              <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
            </div>
          )}
          <div ref={intersectionElementRef}></div>
        </>
      )}
    </div>
  );
};
