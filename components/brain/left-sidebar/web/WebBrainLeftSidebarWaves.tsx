import React from "react";
import WebUnifiedWavesList from "./WebUnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

interface WebBrainLeftSidebarWavesProps {
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
}

const WebBrainLeftSidebarWaves: React.FC<WebBrainLeftSidebarWavesProps> = ({
  scrollContainerRef,
}) => {

  
  const { waves, activeWave, registerWave } = useMyStream();

  const onNextPage = () => {
    if (waves.hasNextPage && !waves.isFetchingNextPage && !waves.isFetching) {
      waves.fetchNextPage();
    }
  };

  return (
    <WebUnifiedWavesList
      waves={waves.list}
      activeWaveId={activeWave.id}
      fetchNextPage={onNextPage}
      hasNextPage={waves.hasNextPage}
      isFetching={waves.isFetching}
      isFetchingNextPage={waves.isFetchingNextPage}
      onHover={registerWave}
      scrollContainerRef={scrollContainerRef}
    />
  );
};

export default WebBrainLeftSidebarWaves;