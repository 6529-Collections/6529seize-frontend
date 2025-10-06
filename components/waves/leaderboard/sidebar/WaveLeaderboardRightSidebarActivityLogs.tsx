import React from "react";
import { ApiWave } from "@/generated/models/ApiWave";

import { useAuth } from "@/components/auth/Auth";
import { useWaveActivityLogs } from "@/hooks/useWaveActivityLogs";
import { WaveLeaderboardRightSidebarActivityLog } from "./WaveLeaderboardRightSidebarActivityLog";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveLeaderboardRightSidebarActivityLogsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardRightSidebarActivityLogs: React.FC<
  WaveLeaderboardRightSidebarActivityLogsProps
> = ({ wave, onDropClick }) => {
  const { connectedProfile } = useAuth();
  const { logs, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useWaveActivityLogs({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? undefined,
      reverse: false,
      dropId: null,
      logTypes: ["DROP_VOTE_EDIT"],
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  if (logs.length === 0 && !isLoading) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-mt-10 tw-space-y-6 tw-text-iron-400">
        <div className="tw-relative tw-group">
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-primary-400/20 tw-via-indigo-500/10 tw-to-iron-800/10 tw-rounded-full tw-animate-[spin_4s_linear_infinite] desktop-hover:group-hover:tw-from-primary-400/30"></div>
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-iron-800/10 tw-via-indigo-500/10 tw-to-primary-400/20 tw-rounded-full tw-animate-[spin_5s_linear_infinite] desktop-hover:group-hover:tw-to-primary-400/30"></div>
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-radial tw-from-primary-300/5 tw-to-transparent tw-animate-pulse"></div>
          <svg
            className="tw-size-10 tw-flex-shrink-0 tw-relative tw-text-white/60"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22.7 13.5L20.7005 11.5L18.7 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909M12 7V12L15 14"
            />
          </svg>
        </div>
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2">
          <span className="tw-tracking-tight tw-text-lg tw-font-semibold tw-bg-gradient-to-br tw-from-iron-200 tw-via-iron-300 tw-to-iron-400 tw-bg-clip-text tw-text-transparent">
            Be the First to Make a Vote
          </span>
          <p className="tw-text-sm tw-text-iron-500 tw-text-center tw-mb-0 tw-max-w-64">
            Vote on drops to see activity updates appear here in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-space-y-3">
      {logs.map((log) => (
        <WaveLeaderboardRightSidebarActivityLog
          key={log.id}
          log={log}
          creditType={wave.voting.credit_type}
          onDropClick={onDropClick}
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
