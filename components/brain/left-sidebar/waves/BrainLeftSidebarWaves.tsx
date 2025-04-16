import React from "react";
import UnifiedWavesList from "./UnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

const BrainLeftSidebarWaves: React.FC = () => {
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
      isFetchingNextPage={waves.isFetchingNextPage}
      onHover={registerWave}
    />
  );
};

export default BrainLeftSidebarWaves;
