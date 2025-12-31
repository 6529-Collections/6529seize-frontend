import type { ReadonlyURLSearchParams } from "next/navigation";
import React, { useCallback, useMemo } from "react";

interface UseWaveNavigationOptions {
  readonly basePath: string;
  readonly activeWaveId: string | null;
  readonly setActiveWave: (
    waveId: string | null,
    options?: {
      isDirectMessage?: boolean;
      serialNo?: number | null;
      divider?: number | null;
    }
  ) => void;
  readonly onHover: (waveId: string) => void;
  readonly prefetchWaveData: (waveId: string) => void;
  readonly searchParams: ReadonlyURLSearchParams | null;
  readonly waveId: string;
  readonly hasTouchScreen: boolean;
  readonly firstUnreadDropSerialNo?: number | null;
}

interface UseWaveNavigationResult {
  readonly href: string;
  readonly isActive: boolean;
  readonly onMouseEnter: (() => void) | undefined;
  readonly onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const useWaveNavigation = ({
  basePath,
  activeWaveId,
  setActiveWave,
  onHover,
  prefetchWaveData,
  searchParams,
  waveId,
  hasTouchScreen,
  firstUnreadDropSerialNo,
}: UseWaveNavigationOptions): UseWaveNavigationResult => {
  const currentWaveId = activeWaveId ?? searchParams?.get("wave") ?? undefined;
  const isDirectMessage = basePath === "/messages";

  const href = useMemo(() => {
    if (currentWaveId === waveId) {
      return basePath;
    }

    const params = new URLSearchParams();
    params.set("wave", waveId);
    if (firstUnreadDropSerialNo) {
      params.set("serialNo", String(firstUnreadDropSerialNo));
      params.set("divider", String(firstUnreadDropSerialNo));
    }
    return `${basePath}?${params.toString()}`;
  }, [basePath, currentWaveId, waveId, firstUnreadDropSerialNo]);

  const isActive = waveId === currentWaveId;

  const onMouseEnter = useCallback(() => {
    if (waveId === currentWaveId) {
      return;
    }

    onHover(waveId);
    prefetchWaveData(waveId);
  }, [currentWaveId, onHover, prefetchWaveData, waveId]);

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
      onMouseEnter();
      const nextWaveId = waveId === currentWaveId ? null : waveId;
      setActiveWave(nextWaveId, {
        isDirectMessage,
        serialNo: nextWaveId ? firstUnreadDropSerialNo : null,
        divider: nextWaveId ? firstUnreadDropSerialNo : null,
      });
    },
    [
      currentWaveId,
      isDirectMessage,
      onMouseEnter,
      setActiveWave,
      waveId,
      firstUnreadDropSerialNo,
    ]
  );

  return {
    href,
    isActive,
    onMouseEnter: hasTouchScreen ? undefined : onMouseEnter,
    onClick,
  };
};
