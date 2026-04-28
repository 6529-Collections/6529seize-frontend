import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useAuth } from "@/components/auth/Auth";
import { useWaveTopVoters } from "@/hooks/useWaveTopVoters";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { WaveLeaderboardRightSidebarVoter } from "./WaveLeaderboardRightSidebarVoter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

interface WaveLeaderboardRightSidebarVotersProps {
  readonly wave: ApiWave;
}

export const WaveLeaderboardRightSidebarVoters: React.FC<
  WaveLeaderboardRightSidebarVotersProps
> = ({ wave }) => {
  const { connectedProfile } = useAuth();
  const { voters, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useWaveTopVoters({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? undefined,
      reverse: false,
      dropId: null,
      sortDirection: "DESC",
      sort: "ABSOLUTE",
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div className="tw-space-y-2">
      {voters.length === 0 && !isLoading ? (
        <div className="tw-mt-10 tw-flex tw-flex-col tw-items-center tw-justify-center tw-space-y-6 tw-text-iron-400">
          <div className="tw-group tw-relative">
            <div className="tw-absolute tw-inset-0 tw-animate-[spin_4s_linear_infinite] tw-rounded-full tw-bg-gradient-to-br tw-from-primary-400/20 tw-via-indigo-500/10 tw-to-iron-800/10 group-hover:tw-from-primary-400/30"></div>
            <div className="tw-absolute tw-inset-0 tw-animate-[spin_5s_linear_infinite] tw-rounded-full tw-bg-gradient-to-tr tw-from-iron-800/10 tw-via-indigo-500/10 tw-to-primary-400/20 group-hover:tw-to-primary-400/30"></div>
            <div className="tw-bg-gradient-radial tw-absolute tw-inset-0 tw-animate-pulse tw-from-primary-300/5 tw-to-transparent"></div>
            <FontAwesomeIcon
              icon={faClock}
              className="tw-relative tw-size-10 tw-flex-shrink-0 tw-text-white/60"
            />
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2">
            <span className="tw-bg-gradient-to-br tw-from-iron-200 tw-via-iron-300 tw-to-iron-400 tw-bg-clip-text tw-text-lg tw-font-semibold tw-tracking-tight tw-text-transparent">
              Be the First to Make a Vote
            </span>
            <p className="tw-mb-0 tw-max-w-64 tw-text-center tw-text-sm tw-text-iron-500">
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
              creditType={wave.voting.credit_type}
            />
          ))}
          {isFetchingNextPage && (
            <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
              <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400"></div>
            </div>
          )}
          <div ref={intersectionElementRef}></div>
        </>
      )}
    </div>
  );
};
