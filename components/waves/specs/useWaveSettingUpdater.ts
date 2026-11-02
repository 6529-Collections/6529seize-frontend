"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiUpdateWaveHubChat } from "@/generated/models/ApiUpdateWaveHubChat";
import type { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { getWaveChatRepliesUpdate } from "@/helpers/waves/wave-chat-replies.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { updateWaveHub } from "@/services/api/wave-hub-api";
import type { ApiUpdateWaveHubRequest } from "@/generated/models/ApiUpdateWaveHubRequest";
import { useCallback, useContext, useState } from "react";

type WaveChatUpdate = ApiUpdateWaveHubChat;

export const useWaveSettingUpdater = (wave: ApiWave) => {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });

  const updateWave = useCallback(
    async (
      body: ApiUpdateWaveHubRequest,
      closeEditor: () => void,
      onSuccess?: () => void
    ) => {
      setMutating(true);

      try {
        const { success } = await requestAuth();
        if (!success) {
          setToast({
            type: "error",
            message:
              "Couldn't authenticate. Reconnect your wallet and try again.",
          });
          return;
        }

        await updateWaveHub(wave.id, body);
        onSuccess?.();
        onWaveCreated();
        closeEditor();
      } catch (error) {
        setToast({
          type: "error",
          title: "Couldn't save these wave settings.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
      } finally {
        setMutating(false);
      }
    },
    [onWaveCreated, requestAuth, setToast, wave.id]
  );

  const saveChatUpdate = useCallback(
    (
      closeEditor: () => void,
      getChatUpdate: (chat: WaveChatUpdate) => WaveChatUpdate
    ) => {
      if (mutating) {
        return;
      }

      const current: WaveChatUpdate = {
        scope: { group_id: wave.chat.scope.group?.id ?? null },
        enabled: wave.chat.enabled,
        links_disabled: wave.chat.links_disabled === true,
        slow_mode_cooldown_ms: wave.chat.slow_mode_cooldown_ms ?? null,
        ...getWaveChatRepliesUpdate(wave.chat),
      };
      const next = getChatUpdate(current);
      const chat = Object.fromEntries(
        Object.entries({
          ...next,
          slow_mode_cooldown_ms: next.slow_mode_cooldown_ms ?? null,
        }).filter(
          ([key, value]) =>
            JSON.stringify(value) !==
            JSON.stringify(current[key as keyof WaveChatUpdate] ?? null)
        )
      );
      updateWave({ chat }, closeEditor).catch(() => undefined);
    },
    [mutating, updateWave, wave]
  );

  return {
    canEdit,
    mutating,
    saveChatUpdate,
    setToast,
  };
};
