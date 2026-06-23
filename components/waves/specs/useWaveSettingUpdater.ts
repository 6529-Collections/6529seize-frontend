"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  canEditWave,
  convertWaveToUpdateWave,
} from "@/helpers/waves/waves.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useContext, useState } from "react";

type WaveChatUpdate = ApiUpdateWaveRequest["chat"];
type WaveConfigUpdate = ApiUpdateWaveRequest["wave"];

export const useWaveSettingUpdater = (wave: ApiWave) => {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });

  const updateWave = useCallback(
    async (
      body: ApiUpdateWaveRequest,
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

        await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
          endpoint: `waves/${wave.id}`,
          body,
        });
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

      const body = convertWaveToUpdateWave(wave);
      void updateWave(
        {
          ...body,
          chat: getChatUpdate(body.chat),
        },
        closeEditor
      );
    },
    [mutating, updateWave, wave]
  );

  const saveWaveConfigUpdate = useCallback(
    (
      closeEditor: () => void,
      getWaveConfigUpdate: (waveConfig: WaveConfigUpdate) => WaveConfigUpdate,
      onSuccess?: () => void
    ) => {
      if (mutating) {
        return;
      }

      const body = convertWaveToUpdateWave(wave);
      void updateWave(
        {
          ...body,
          wave: getWaveConfigUpdate(body.wave),
        },
        closeEditor,
        onSuccess
      );
    },
    [mutating, updateWave, wave]
  );

  return {
    canEdit,
    mutating,
    saveChatUpdate,
    saveWaveConfigUpdate,
    setToast,
  };
};
