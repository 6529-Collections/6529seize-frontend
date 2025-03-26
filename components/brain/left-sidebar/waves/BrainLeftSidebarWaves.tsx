import React, { useEffect, useRef } from "react";
import useWavesList from "../../../../hooks/useWavesList";
import { useRouter } from "next/router";
import UnifiedWavesList from "./UnifiedWavesList";

interface BrainLeftSidebarWavesProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  activeWaveId,
}) => {
  const router = useRouter();
  
  // Store the wave ID from router.query to compare against and avoid unnecessary pins
  const lastPinnedWaveIdRef = useRef<string | null>(null);
  
  // Use useRef instead of useMemo to completely disconnect from render cycle
  const activeWaveIdRef = useRef<string | null>(activeWaveId);
  
  // Update the ref when activeWaveId changes, but don't trigger re-renders
  useEffect(() => {
    activeWaveIdRef.current = activeWaveId;
  }, [activeWaveId]);
  
  // Use fixed refetch interval to avoid dependency issues
  const refetchInterval = 10000;

  
  const { 
    waves, 
    addPinnedWave, 
    resetWaveNewDropsCount, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useWavesList(refetchInterval, activeWaveIdRef.current);

  // Use separate useEffect for handling router query to avoid dependency cycles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const waveId = router.query.wave;
    if (waveId && typeof waveId === "string" && waveId !== lastPinnedWaveIdRef.current) {
      lastPinnedWaveIdRef.current = waveId;
      addPinnedWave(waveId);
    }
  }, [router.query]); // Intentionally omit addPinnedWave to avoid dependency cycle

  return (
    <UnifiedWavesList
      waves={waves}
      activeWaveId={activeWaveId}
      resetWaveCount={resetWaveNewDropsCount}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
};

export default BrainLeftSidebarWaves;
