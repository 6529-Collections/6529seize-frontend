import React, { useEffect } from "react";
import WebUnifiedWavesList from "./WebUnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";
import { useWavesWithUnread } from "@/contexts/wave/WaveUnreadContext";

interface WebBrainLeftSidebarWavesProps {
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly isCollapsed?: boolean | undefined;
  readonly showProfileFeedShortcut?: boolean | undefined;
}

const WebBrainLeftSidebarWaves: React.FC<WebBrainLeftSidebarWavesProps> = ({
  scrollContainerRef,
  isCollapsed = false,
  showProfileFeedShortcut = true,
}) => {
  const { waves, registerWave, requestMainWavesList } = useMyStream();
  // Live unread counts and activity order; only the receiving wave's row
  // gets a new object when a message arrives.
  const liveWaves = useWavesWithUnread(waves.list);

  useEffect(() => requestMainWavesList(), [requestMainWavesList]);

  const onNextPage = () => {
    if (waves.hasNextPage && !waves.isFetchingNextPage && !waves.isFetching) {
      waves.fetchNextPage();
    }
  };

  return (
    <WebUnifiedWavesList
      waves={liveWaves}
      fetchNextPage={onNextPage}
      hasNextPage={waves.hasNextPage}
      isFetching={waves.isFetching}
      isPinnedWavesLoading={waves.isPinnedWavesLoading ?? false}
      isFetchingNextPage={waves.isFetchingNextPage}
      hasLoadingError={waves.hasLoadingError}
      retryLoading={waves.retryLoading}
      onHover={registerWave}
      scrollContainerRef={scrollContainerRef}
      isCollapsed={isCollapsed}
      showProfileFeedShortcut={showProfileFeedShortcut}
    />
  );
};

export default WebBrainLeftSidebarWaves;
