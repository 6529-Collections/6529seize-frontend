import React from "react";
import UnifiedWavesList from "../waves/UnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

const BrainLeftSidebarDirectMessages: React.FC = () => {
  const { directMessages, activeWave, registerWave } = useMyStream();

  const onNextPage = () => {
    if (
      directMessages.hasNextPage &&
      !directMessages.isFetchingNextPage &&
      !directMessages.isFetching
    ) {
      directMessages.fetchNextPage();
    }
  };

  return (
    <UnifiedWavesList
      waves={directMessages.list}
      activeWaveId={activeWave.id}
      fetchNextPage={onNextPage}
      hasNextPage={directMessages.hasNextPage}
      isFetchingNextPage={directMessages.isFetchingNextPage}
      onHover={registerWave}
    />
  );
};

export default BrainLeftSidebarDirectMessages; 