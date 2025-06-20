import React from "react";
import UnifiedWavesList from "./UnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

interface BrainLeftSidebarWavesProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  scrollContainerRef,
}) => {

  
  const { waves, activeWave, registerWave } = useMyStream();

  const onNextPage = () => {
    if (waves.hasNextPage && !waves.isFetchingNextPage && !waves.isFetching) {
      waves.fetchNextPage();
    }
  };

  return (
    <UnifiedWavesList
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

export default BrainLeftSidebarWaves;
