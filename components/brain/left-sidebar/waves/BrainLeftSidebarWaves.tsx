import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import UnifiedWavesList from "./UnifiedWavesList";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

const BrainLeftSidebarWaves: React.FC = () => {
  const router = useRouter();

  const { waves, activeWave, registerWave } = useMyStream();

  // Store the wave ID from router.query to compare against and avoid unnecessary pins
  const lastPinnedWaveIdRef = useRef<string | null>(null);

  // Use useRef instead of useMemo to completely disconnect from render cycle
  const activeWaveIdRef = useRef<string | null>(activeWave.id);

  // Update the ref when activeWaveId changes, but don't trigger re-renders
  useEffect(() => {
    activeWaveIdRef.current = activeWave.id;
  }, [activeWave.id]);

  // Use separate useEffect for handling router query to avoid dependency cycles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const waveId = router.query.wave;
    if (
      waveId &&
      typeof waveId === "string" &&
      waveId !== lastPinnedWaveIdRef.current
    ) {
      lastPinnedWaveIdRef.current = waveId;
      waves.addPinnedWave(waveId);
    }
  }, [router.query]); // Intentionally omit addPinnedWave to avoid dependency cycle

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
