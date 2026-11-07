import React, { useEffect } from "react";
import UnifiedWavesList from "./UnifiedWavesList";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWavesWithUnread } from "@/contexts/wave/WaveUnreadContext";

interface BrainLeftSidebarWavesProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  scrollContainerRef,
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
    <UnifiedWavesList
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
    />
  );
};

export default BrainLeftSidebarWaves;
