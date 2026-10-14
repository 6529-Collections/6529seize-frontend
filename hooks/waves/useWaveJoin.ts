"use client";

import { useContext, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveSubscriptionActions } from "@/generated/models/ApiWaveSubscriptionActions";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";

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

const getSubscriptionEndpoint = (waveId: string) =>
  `waves/${waveId}/subscriptions`;

/**
 * The single join/leave code path for waves. It checks the session, calls the
 * subscription API, then updates every wave and sidebar cache through
 * `onWaveFollowChange`, so each Join control stays in sync.
 */
export function useWaveJoin(
  wave: WaveJoinTarget,
  { subscribeToAllDrops = false }: UseWaveJoinOptions = {}
): WaveJoinControls {
  const { setToast, requestAuth } = useAuth();
  const { onWaveFollowChange } = useContext(ReactQueryWrapperContext);
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
      await commonApiPost<
        ApiWaveSubscriptionActions,
        ApiWaveSubscriptionActions
      >({
        endpoint: getSubscriptionEndpoint(wave.id),
        body: { actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS },
      });
      // The join is recorded as soon as the server accepts it; the optional
      // all-messages subscription below must not undo or misreport it.
      onWaveFollowChange({ waveId: wave.id, following: true });
      if (subscribeToAllDrops) {
        try {
          await commonApiPost({
            endpoint: `notifications/wave-subscription/${wave.id}`,
            body: {},
          });
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
      await commonApiDeleteWithBody<
        ApiWaveSubscriptionActions,
        ApiWaveSubscriptionActions
      >({
        endpoint: getSubscriptionEndpoint(wave.id),
        body: { actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS },
      });
    },
    onSuccess: () => {
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
