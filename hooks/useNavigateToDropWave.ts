"use client";

import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useDeviceInfo from "./useDeviceInfo";

type DropWaveNavigationTarget = {
  readonly serial_no?: number | string | null;
  readonly wave?: {
    readonly id?: string | null;
    readonly chat?: {
      readonly scope?: {
        readonly group?: {
          readonly is_direct_message?: boolean | null;
        } | null;
      } | null;
    } | null;
  } | null;
};

export function useNavigateToDropWave(): (
  drop: DropWaveNavigationTarget
) => void {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  return useCallback(
    (drop: DropWaveNavigationTarget) => {
      const wave = drop.wave;
      const waveId = wave?.id?.trim();
      const serialNo = `${drop.serial_no ?? ""}`.trim();

      if (!wave || !waveId || !serialNo) {
        return;
      }

      const href = getWaveRoute({
        waveId,
        serialNo,
        isDirectMessage: wave.chat?.scope?.group?.is_direct_message === true,
        isApp,
      });

      router.push(href);
    },
    [isApp, router]
  );
}
