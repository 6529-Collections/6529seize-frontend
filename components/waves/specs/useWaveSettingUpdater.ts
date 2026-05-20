"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  canEditWave,
  convertWaveToUpdateWave,
} from "@/helpers/waves/waves.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useContext, useState } from "react";

type WaveChatUpdate = ApiUpdateWaveRequest["chat"];

export const useWaveSettingUpdater = (wave: ApiWave) => {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });

  const updateWave = useCallback(
    async (body: ApiUpdateWaveRequest, closeEditor: () => void) => {
      setMutating(true);

      try {
        const { success } = await requestAuth();
        if (!success) {
          setToast({
            type: "error",
            message: "Failed to authenticate",
          });
          return;
        }

        await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
          endpoint: `waves/${wave.id}`,
          body,
        });
        onWaveCreated();
        closeEditor();
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : String(error),
          type: "error",
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

  return {
    canEdit,
    mutating,
    saveChatUpdate,
    setToast,
  };
};
