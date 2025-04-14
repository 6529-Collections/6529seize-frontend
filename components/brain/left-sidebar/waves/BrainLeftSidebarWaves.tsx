import React from "react";
import UnifiedWavesList from "./UnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

interface BrainLeftSidebarWavesProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  activeWaveId,
}) => {
  const {
    waves,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useMyStream();

  const onNextPage = () => {
    if (hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage();
    }
  };

  return (
    <UnifiedWavesList
      waves={waves}
      activeWaveId={activeWaveId}
      fetchNextPage={onNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
};

export default BrainLeftSidebarWaves;
