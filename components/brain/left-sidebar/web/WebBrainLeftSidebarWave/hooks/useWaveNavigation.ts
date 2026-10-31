import type { ReadonlyURLSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useMemo } from "react";
import {
  getActiveWaveIdFromUrl,
  getWaveRoute,
} from "@/helpers/navigation.helpers";
import { useHoverIntent } from "@/hooks/useHoverIntent";

interface UseWaveNavigationOptions {
  readonly basePath: string;
  readonly activeWaveId: string | null;
  readonly setActiveWave: (
    waveId: string | null,
    options?: {
      isDirectMessage?: boolean | undefined;
      serialNo?: number | null | undefined;
      divider?: number | null | undefined;
    }
  ) => void;
  readonly onHover: (waveId: string) => void;
  readonly prefetchWaveData: (waveId: string) => Promise<void> | void;
  readonly pathname: string | null;
  readonly searchParams: ReadonlyURLSearchParams | null;
  readonly waveId: string;
  readonly hasTouchScreen: boolean;
  readonly firstUnreadDropSerialNo?: number | null | undefined;
}

interface UseWaveNavigationResult {
  readonly href: string;
  readonly isActive: boolean;
  readonly onMouseEnter: (() => void) | undefined;
  readonly onMouseLeave: (() => void) | undefined;
  readonly onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const useWaveNavigation = ({
  basePath,
  activeWaveId,
  setActiveWave,
  onHover,
  prefetchWaveData,
  pathname,
  searchParams,
  waveId,
  hasTouchScreen,
  firstUnreadDropSerialNo,
}: UseWaveNavigationOptions): UseWaveNavigationResult => {
  const currentWaveId =
    activeWaveId ??
    getActiveWaveIdFromUrl({ pathname, searchParams }) ??
    undefined;
  const isDirectMessage = basePath === "/messages";

  const href = useMemo(() => {
    if (currentWaveId === waveId) {
      return basePath;
    }
    return getWaveRoute({
      waveId,
      extraParams:
        typeof firstUnreadDropSerialNo === "number"
          ? { divider: String(firstUnreadDropSerialNo) }
          : undefined,
      isDirectMessage,
      isApp: false,
    });
  }, [
    basePath,
    currentWaveId,
    waveId,
    firstUnreadDropSerialNo,
    isDirectMessage,
  ]);

  const isActive = waveId === currentWaveId;

  const prefetchWave = useCallback(() => {
    if (waveId === currentWaveId) {
      return;
    }

    onHover(waveId);
    void prefetchWaveData(waveId);
  }, [currentWaveId, onHover, prefetchWaveData, waveId]);

  // Prefetch on hover only once the pointer rests on the row, not while it
  // sweeps across the list. Clicking prefetches right away instead.
  const { schedule: scheduleHoverIntent, cancel: cancelHoverIntent } =
    useHoverIntent();
  const onMouseEnter = useCallback(
    () => scheduleHoverIntent(prefetchWave),
    [prefetchWave, scheduleHoverIntent]
  );

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button === 1 ||
        event.button === 2
      ) {
        return; // allow new-tab behavior
      }
      event.preventDefault();
      cancelHoverIntent();
      prefetchWave();
      const nextWaveId = waveId === currentWaveId ? null : waveId;
      setActiveWave(nextWaveId, {
        isDirectMessage,
        divider: nextWaveId ? firstUnreadDropSerialNo : null,
      });
    },
    [
      cancelHoverIntent,
      currentWaveId,
      isDirectMessage,
      prefetchWave,
      setActiveWave,
      waveId,
      firstUnreadDropSerialNo,
    ]
  );

  return {
    href,
    isActive,
    onMouseEnter: hasTouchScreen ? undefined : onMouseEnter,
    onMouseLeave: hasTouchScreen ? undefined : cancelHoverIntent,
    onClick,
  };
};
