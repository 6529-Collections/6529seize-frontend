import React from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";

import { useAuth } from "../../../../auth/Auth";
import { useWaveActivityLogs } from "../../../../../hooks/useWaveActivityLogs";
import { WaveLeaderboardRightSidebarActivityLog } from "./WaveLeaderboardRightSidebarActivityLog";
import { useIntersectionObserver } from "../../../../../hooks/useIntersectionObserver";

interface WaveLeaderboardRightSidebarActivityLogsProps {
  readonly wave: ApiWave;
}

export const WaveLeaderboardRightSidebarActivityLogs: React.FC<
  WaveLeaderboardRightSidebarActivityLogsProps
> = ({ wave }) => {
  const { connectedProfile } = useAuth();
  const { logs, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useWaveActivityLogs({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: false,
      dropId: null,
      logTypes: ["DROP_VOTE_EDIT"],
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div className="tw-space-y-3">
      {logs.map((log) => (
        <WaveLeaderboardRightSidebarActivityLog key={log.id} log={log} />
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
