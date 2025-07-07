"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Hook to manage the active wave ID state and synchronize it with the URL
 * @returns {Object} Object containing activeWaveId and setActiveWave function
 */
export function useActiveWaveManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null);

  // Sync activeWaveId with URL when router query changes
  useEffect(() => {
    const waveId = searchParams?.get("wave");
    if (typeof waveId === "string") {
      setActiveWaveId(waveId);
    } else if (waveId === undefined && activeWaveId) {
      // URL no longer has wave parameter
      setActiveWaveId(null);
    }
  }, [searchParams, activeWaveId]);

  // Function to programmatically change active wave (and update URL)
  const setActiveWave = useCallback(
    (waveId: string | null) => {
      setActiveWaveId(waveId);

      // Update URL
      if (waveId) {
        router.push(`/my-stream?wave=${waveId}`);
      } else {
        router.push("/my-stream");
      }
    },
    [router]
  );

  return {
    activeWaveId,
    setActiveWave,
  };
}
