import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage the active wave ID state and synchronize it with the URL
 * @returns {Object} Object containing activeWaveId and setActiveWave function
 */
export function useActiveWaveManager() {
  const router = useRouter();
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null);

  // Sync activeWaveId with URL when router query changes
  useEffect(() => {
    const { wave: waveId } = router.query;
    if (typeof waveId === 'string') {
      setActiveWaveId(waveId);
    } else if (waveId === undefined && activeWaveId) {
      // URL no longer has wave parameter
      setActiveWaveId(null);
    }
  }, [router.query, activeWaveId]);

  // Function to programmatically change active wave (and update URL)
  const setActiveWave = useCallback(
    (waveId: string | null) => {
      setActiveWaveId(waveId);

      // Update URL
      if (waveId) {
        router.push(`/my-stream?wave=${waveId}`, undefined, { shallow: true });
      } else {
        router.push('/my-stream', undefined, { shallow: true });
      }
    },
    [router]
  );

  return {
    activeWaveId,
    setActiveWave,
  };
}
