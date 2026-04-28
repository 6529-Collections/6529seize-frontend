"use client";

import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useDeviceInfo from "./useDeviceInfo";

type DropWaveNavigationTarget = {
  readonly wave?:
    | {
        readonly id?: string | null | undefined;
        readonly chat?:
          | {
              readonly scope?:
                | {
                    readonly group?:
                      | {
                          readonly is_direct_message?:
                            | boolean
                            | null
                            | undefined;
                        }
                      | null
                      | undefined;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
  readonly serial_no: number | string;
};

export function useNavigateToDropWave(): (
  drop: DropWaveNavigationTarget
) => void {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  return useCallback(
    (drop: DropWaveNavigationTarget) => {
      const waveId = drop.wave?.id;
      if (!waveId) {
        return;
      }

      const href = getWaveRoute({
        waveId,
        serialNo: drop.serial_no,
        isDirectMessage:
          drop.wave.chat?.scope?.group?.is_direct_message ?? false,
        isApp,
      });

      router.push(href);
    },
    [isApp, router]
  );
}
