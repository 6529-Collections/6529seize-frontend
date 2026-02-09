import type { ReadonlyURLSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useMemo } from "react";
import {
  getActiveWaveIdFromUrl,
  getWaveRoute,
} from "@/helpers/navigation.helpers";

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
  readonly prefetchWaveData: (waveId: string) => void;
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
