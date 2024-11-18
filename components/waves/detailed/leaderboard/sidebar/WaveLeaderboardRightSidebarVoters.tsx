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
    </div>
  );
};
