"use client";

import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useDeviceInfo from "./useDeviceInfo";
import { withProfileFeedReturn } from "@/helpers/waves/profile-feed-navigation";

type DropWaveNavigationTarget = {
  readonly id?: string | null;
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
  drop: DropWaveNavigationTarget,
  options?: { readonly edit?: boolean | undefined }
) => void {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  return useCallback(
    (
      drop: DropWaveNavigationTarget,
      options?: { readonly edit?: boolean | undefined }
    ) => {
      const wave = drop.wave;
      const waveId = wave?.id?.trim();
      const serialNo = `${drop.serial_no ?? ""}`.trim();

      if (!wave || !waveId || !serialNo) {
        return;
      }

      const isDirectMessage =
        wave.chat?.scope?.group?.is_direct_message === true;
      const extraParams: Record<string, string> = {};
      if (options?.edit && drop.id) extraParams["editPost"] = drop.id;
      const href = getWaveRoute({
        waveId,
        serialNo,
        extraParams,
        isDirectMessage,
        isApp,
      });

      router.push(withProfileFeedReturn(href, isApp));
    },
    [isApp, router]
  );
}
