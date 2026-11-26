"use client";

import "@/i18n/namespaces/wave-sidebar";
import { useAuth } from "@/components/auth/Auth";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  MAX_PINNED_WAVES,
  usePinnedWavesServer,
} from "@/hooks/usePinnedWavesServer";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

/** One pin operation and its feedback for desktop controls and touch gestures. */
export function useSidebarWavePin(waveId: string, isPinned: boolean) {
  const { pinnedIds, isOperationInProgress, canPinWave, pinWave, unpinWave } =
    usePinnedWavesServer();
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const locale = useBrowserLocale();
  const pinLimit = formatInteger(locale, MAX_PINNED_WAVES);
  const canManage = Boolean(connectedProfile?.handle && !activeProfileProxy);
  const isProcessing = isOperationInProgress(waveId);

  async function togglePin(): Promise<
    "updated" | "limit" | "ignored" | "error"
  > {
    if (!canManage || isOperationInProgress(waveId)) return "ignored";
    try {
      if (isPinned) {
        await unpinWave(waveId);
      } else if (canPinWave(waveId)) {
        await pinWave(waveId);
      } else {
        setToast({
          type: "error",
          message: t(locale, "waves.sidebar.pinControl.limitMessage", {
            count: pinLimit,
          }),
        });
        return "limit";
      }
      return "updated";
    } catch (error) {
      setToast({
        type: "error",
        title: t(
          locale,
          isPinned
            ? "waves.sidebar.pinControl.unpinErrorTitle"
            : "waves.sidebar.pinControl.pinErrorTitle"
        ),
        description: t(locale, "waves.sidebar.pinControl.retryDescription"),
        details: getToastErrorDetails(error),
      });
      return "error";
    }
  }

  return {
    canManage,
    canPinCurrentWave: canPinWave(waveId),
    isProcessing,
    pinnedIdsKey: pinnedIds.join("|"),
    pinLimit,
    togglePin,
  };
}
