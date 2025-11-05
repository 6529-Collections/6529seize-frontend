import React from "react";
import WebUnifiedWavesList from "./WebUnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

interface WebBrainLeftSidebarWavesProps {
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly isCollapsed?: boolean;
}

const WebBrainLeftSidebarWaves: React.FC<WebBrainLeftSidebarWavesProps> = ({
  scrollContainerRef,
  isCollapsed = false,
}) => {

  
  const { waves, registerWave } = useMyStream();

  const onNextPage = () => {
    if (waves.hasNextPage && !waves.isFetchingNextPage && !waves.isFetching) {
      waves.fetchNextPage();
    }
  };

  return (
    <WebUnifiedWavesList
      waves={waves.list}
      fetchNextPage={onNextPage}
      hasNextPage={waves.hasNextPage}
      isFetching={waves.isFetching}
      isFetchingNextPage={waves.isFetchingNextPage}
      onHover={registerWave}
      scrollContainerRef={scrollContainerRef}
      isCollapsed={isCollapsed}
    />
  );
};

export default WebBrainLeftSidebarWaves;
