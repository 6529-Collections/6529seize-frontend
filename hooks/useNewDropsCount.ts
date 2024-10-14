import { useState, useMemo, useEffect } from "react";
import { ApiWave } from "../generated/models/ApiWave";

export const useNewDropsCount = (waves: ApiWave[], activeWaveId: string) => {
  const [initialDropsCounts, setInitialDropsCounts] = useState<
    Record<string, number>
  >({});
  const [newDropsCounts, setNewDropsCounts] = useState<Record<string, number>>(
    {}
  );

  // Initialize initial drops counts
  useEffect(() => {
    const newInitialCounts: Record<string, number> = {};
    waves.forEach((wave) => {
      if (!(wave.id in initialDropsCounts)) {
        newInitialCounts[wave.id] = wave.metrics.drops_count;
      }
    });
    if (Object.keys(newInitialCounts).length > 0) {
      setInitialDropsCounts((prev) => ({ ...prev, ...newInitialCounts }));
    }
  }, [waves, initialDropsCounts]);

  // Calculate new drops counts
  const calculatedNewDropsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    waves.forEach((wave) => {
      if (wave.id in initialDropsCounts) {
        counts[wave.id] =
          wave.metrics.drops_count - initialDropsCounts[wave.id];
      } else {
        counts[wave.id] = 0;
      }
    });
    return counts;
  }, [waves, initialDropsCounts]);

  // Update new drops counts
  useEffect(() => {
    setNewDropsCounts(calculatedNewDropsCounts);
  }, [calculatedNewDropsCounts]);

  // Reset function for when a wave becomes active
  const resetWaveCount = (waveId: string) => {
    const wave = waves.find((w) => w.id === waveId);
    if (wave) {
      setInitialDropsCounts((prev) => ({
        ...prev,
        [waveId]: wave.metrics.drops_count,
      }));
      setNewDropsCounts((prev) => ({ ...prev, [waveId]: 0 }));
    }
  };

  // Reset active wave count
  useEffect(() => {
    resetWaveCount(activeWaveId);
  }, [activeWaveId, waves]);

  return { newDropsCounts, resetWaveCount };
};
