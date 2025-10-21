"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";

/**
 * Hook to manage the active wave ID state and synchronize it with the URL.
 * We rely on the `wave` query param as the single source of truth.
 */
export function useActiveWaveManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();

  const activeWaveId = useMemo(() => {
    const waveId = searchParams?.get("wave");
    return typeof waveId === "string" ? waveId : null;
  }, [searchParams]);

  const setActiveWave = useCallback(
    (
      waveId: string | null,
      options?: { isDirectMessage?: boolean }
    ) => {
      const isDirectMessage = options?.isDirectMessage ?? false;

      const target = waveId
        ? getWaveRoute({ waveId, isDirectMessage, isApp })
        : getWaveHomeRoute({ isDirectMessage, isApp });

      router.push(target);
    },
    [router, isApp]
  );

  return {
    activeWaveId,
    setActiveWave,
  };
}
