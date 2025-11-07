import { useCallback, useMemo } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';

interface UseWaveNavigationOptions {
  readonly basePath: string;
  readonly onHover: (waveId: string) => void;
  readonly prefetchWaveData: (waveId: string) => void;
  readonly searchParams: ReadonlyURLSearchParams | null;
  readonly waveId: string;
}

interface UseWaveNavigationResult {
  readonly href: string;
  readonly isActive: boolean;
  readonly onMouseEnter: () => void;
}

export const useWaveNavigation = ({
  basePath,
  onHover,
  prefetchWaveData,
  searchParams,
  waveId,
}: UseWaveNavigationOptions): UseWaveNavigationResult => {
  const currentWaveId = searchParams?.get('wave') ?? undefined;

  const href = useMemo(() => {
    if (currentWaveId === waveId) {
      return basePath;
    }

    const params = new URLSearchParams();
    params.set('wave', waveId);
    return `${basePath}?${params.toString()}`;
  }, [basePath, currentWaveId, waveId]);

  const isActive = waveId === currentWaveId;

  const onMouseEnter = useCallback(() => {
    if (waveId === currentWaveId) {
      return;
    }

    onHover(waveId);
    prefetchWaveData(waveId);
  }, [currentWaveId, onHover, prefetchWaveData, waveId]);

  return {
    href,
    isActive,
    onMouseEnter,
  };
};
