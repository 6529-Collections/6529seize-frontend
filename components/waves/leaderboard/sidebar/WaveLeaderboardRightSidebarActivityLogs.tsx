import React, { useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveLog } from "@/generated/models/ApiWaveLog";

import { useAuth } from "@/components/auth/Auth";
import { useWaveActivityLogs } from "@/hooks/useWaveActivityLogs";
import { WaveLeaderboardRightSidebarActivityLog } from "./WaveLeaderboardRightSidebarActivityLog";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { ArrowPathIcon, ClockIcon } from "@heroicons/react/24/outline";
import { WaveLeaderboardRightSidebarState } from "./WaveLeaderboardRightSidebarState";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

const getDropSerialNo = (contents: ApiWaveLog["contents"]): number | null => {
  const drop = (contents as { readonly drop?: unknown }).drop;

  if (typeof drop !== "object" || drop === null || !("serial_no" in drop)) {
    return null;
  }

  const serialNo = drop.serial_no;
  return typeof serialNo === "number" ? serialNo : null;
};

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
      fetchNextPage().catch(() => undefined);
    }
  });

  if (logs.length === 0 && isLoading) {
    return (
      <WaveLeaderboardRightSidebarState
        announce
        emphasizeTitle={false}
        icon={
          <ArrowPathIcon
            aria-hidden="true"
            className="tw-size-5 tw-animate-spin motion-reduce:tw-animate-none"
          />
        }
        title={waveRightPanelText("waves.sidebar.rightPanel.activity.loading")}
      />
    );
  }

  if (logs.length === 0) {
    return (
      <WaveLeaderboardRightSidebarState
        icon={<ClockIcon aria-hidden="true" className="tw-size-5" />}
        title={waveRightPanelText(
          "waves.sidebar.rightPanel.activity.emptyTitle"
        )}
        description={waveRightPanelText(
          "waves.sidebar.rightPanel.activity.emptyDescription"
        )}
      />
    );
  }

  return (
    <div>
      {logs.map((log) => {
        const serialNo = getDropSerialNo(log.contents);

        return (
          <WaveLeaderboardRightSidebarActivityLog
            key={log.id}
            log={log}
            creditType={wave.voting.credit_type}
            onDropClick={
              serialNo === null ? null : () => handleDropClick(serialNo)
            }
          />
        );
      })}
      {isFetchingNextPage && (
        <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
          <div className="tw-size-full tw-animate-loading-bar tw-bg-indigo-400" />
        </div>
      )}
      <div ref={intersectionElementRef} />
    </div>
  );
};
