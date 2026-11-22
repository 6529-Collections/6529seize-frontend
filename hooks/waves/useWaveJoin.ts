"use client";

import { useContext, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useRecordWaveSidebarMembership } from "./useWaveSidebarMembership";
import { t } from "@/i18n/messages";
import {
  setWaveFollowing,
  subscribeToAllWaveDrops,
} from "@/services/api/wave-follow-api";

type WaveJoinTarget = Pick<ApiWave, "id" | "subscribed_actions">;

interface UseWaveJoinOptions {
  /** Also subscribe to notifications for every drop after joining. */
  readonly subscribeToAllDrops?: boolean | undefined;
}

interface WaveJoinControls {
  readonly isJoined: boolean;
  readonly isPending: boolean;
  /** Resolves `true` only when the wave was joined. */
  readonly join: () => Promise<boolean>;
  /** Resolves `true` only when the wave was left. */
  readonly leave: () => Promise<boolean>;
  /** Joins or leaves based on the current membership. */
  readonly toggle: () => Promise<boolean>;
}

/**
 * The single join/leave code path for waves. It checks the session, saves
 * the follow (today's subscription API or a signed record), then updates
 * every wave and sidebar cache through `onWaveFollowChange`, so each Join
 * control stays in sync.
 */
export function useWaveJoin(
  wave: WaveJoinTarget,
  { subscribeToAllDrops = false }: UseWaveJoinOptions = {}
): WaveJoinControls {
  const { setToast, requestAuth } = useAuth();
  const { onWaveFollowChange } = useContext(ReactQueryWrapperContext);
  const recordMembership = useRecordWaveSidebarMembership();
  const locale = useBrowserLocale();
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);
  const isJoined = wave.subscribed_actions.length > 0;

  const showError =
    (
      titleKey:
        | "waves.join.joinErrorTitle"
        | "waves.join.leaveErrorTitle"
        | "waves.join.allMessagesErrorTitle",
      descriptionKey:
        | "waves.join.errorDescription"
        | "waves.join.allMessagesErrorDescription" = "waves.join.errorDescription"
    ) =>
    (error: unknown) => {
      setToast({
        type: "error",
        title: t(locale, titleKey),
        description: t(locale, descriptionKey),
        details: getToastErrorDetails(error),
      });
    };

  const joinMutation = useMutation({
    mutationFn: async () => {
      await setWaveFollowing(wave.id, true);
      // The join is recorded as soon as the server accepts it; the optional
      // all-messages subscription below must not undo or misreport it.
      recordMembership(wave.id, true);
      onWaveFollowChange({ waveId: wave.id, following: true });
      if (subscribeToAllDrops) {
        try {
          await subscribeToAllWaveDrops(wave.id);
        } catch (error) {
          showError(
            "waves.join.allMessagesErrorTitle",
            "waves.join.allMessagesErrorDescription"
          )(error);
        }
      }
    },
    onError: showError("waves.join.joinErrorTitle"),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await setWaveFollowing(wave.id, false);
      // Record only after the final subscription request succeeds.
      recordMembership(wave.id, false);
      onWaveFollowChange({ waveId: wave.id, following: false });
    },
    onError: showError("waves.join.leaveErrorTitle"),
  });

  const changeMembership = async (following: boolean): Promise<boolean> => {
    if (pendingRef.current) {
      return false;
    }

    pendingRef.current = true;
    setIsPending(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        return false;
      }
      await (following ? joinMutation : leaveMutation).mutateAsync();
      return true;
    } catch {
      // The mutation's onError already explained the failure.
      return false;
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  };

  return {
    isJoined,
    isPending,
    join: () => changeMembership(true),
    leave: () => changeMembership(false),
    toggle: () => changeMembership(!isJoined),
  };
}
