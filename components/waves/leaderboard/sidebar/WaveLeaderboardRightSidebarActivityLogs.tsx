import React, { useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";

import { useAuth } from "@/components/auth/Auth";
import { useWaveActivityLogs } from "@/hooks/useWaveActivityLogs";
import { WaveLeaderboardRightSidebarActivityLog } from "./WaveLeaderboardRightSidebarActivityLog";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { ArrowPathIcon, ClockIcon } from "@heroicons/react/24/outline";
import { WaveLeaderboardRightSidebarState } from "./WaveLeaderboardRightSidebarState";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const WAVE_RIGHT_SIDEBAR_LOCALE = DEFAULT_LOCALE;

interface WaveLeaderboardRightSidebarActivityLogsProps {
  readonly wave: ApiWave;
}

export const WaveLeaderboardRightSidebarActivityLogs: React.FC<
  WaveLeaderboardRightSidebarActivityLogsProps
> = ({ wave }) => {
  const waveChatScroll = useWaveChatScrollOptional();

  const handleDropClick = useCallback(
    (serialNo: number) => {
      waveChatScroll?.requestScrollToSerialNo({
        waveId: wave.id,
        serialNo,
      });
    },
    [waveChatScroll, wave.id]
  );
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

  if (logs.length === 0 && isLoading) {
    return (
      <WaveLeaderboardRightSidebarState
        announce
        icon={
          <ArrowPathIcon
            aria-hidden="true"
            className="tw-size-5 tw-animate-spin motion-reduce:tw-animate-none"
          />
        }
        title={t(
          WAVE_RIGHT_SIDEBAR_LOCALE,
          "waves.sidebar.rightPanel.activity.loading"
        )}
      />
    );
  }

  if (logs.length === 0) {
    return (
      <WaveLeaderboardRightSidebarState
        icon={<ClockIcon aria-hidden="true" className="tw-size-5" />}
        title={t(
          WAVE_RIGHT_SIDEBAR_LOCALE,
          "waves.sidebar.rightPanel.activity.emptyTitle"
        )}
        description={t(
          WAVE_RIGHT_SIDEBAR_LOCALE,
          "waves.sidebar.rightPanel.activity.emptyDescription"
        )}
      />
    );
  }

  return (
    <div>
      {logs.map((log) => (
        <WaveLeaderboardRightSidebarActivityLog
          key={log.id}
          log={log}
          creditType={wave.voting.credit_type}
          onDropClick={() => handleDropClick(log.contents["drop"]?.serial_no)}
        />
      ))}
      {isFetchingNextPage && (
        <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
          <div className="tw-size-full tw-animate-loading-bar tw-bg-indigo-400" />
        </div>
      )}
      <div ref={intersectionElementRef} />
    </div>
  );
};
