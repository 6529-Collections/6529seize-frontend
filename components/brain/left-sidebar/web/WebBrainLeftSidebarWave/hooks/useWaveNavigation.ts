import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  readonly onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const useWaveNavigation = ({
  basePath,
  onHover,
  prefetchWaveData,
  searchParams,
  waveId,
}: UseWaveNavigationOptions): UseWaveNavigationResult => {
  const router = useRouter();
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

  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Use router.replace for shallow client-side navigation
    router.replace(href, { scroll: false });
    onMouseEnter();
  }, [href, router, onMouseEnter]);

  return {
    href,
    isActive,
    onMouseEnter,
    onClick,
  };
};
