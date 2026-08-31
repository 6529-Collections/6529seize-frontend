"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import type { TypeOptions } from "react-toastify";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveUpdateGroupValidationRequest } from "@/helpers/waves/wave-group-validation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { validateWaveGroups } from "@/services/api/wave-group-validation-api";
import { toErrorMessage } from "@/services/groups/groupMutations";
import type { WaveGroupType } from "../../../WaveGroup.types";
import { getGroupIdFromUpdateBody } from "../utils/waveGroupEdit";
import { getValidationRoles } from "../utils/waveGroupValidation";

type RequestAuth = () => Promise<{ success: boolean }>;

type SetToast = (options: {
  readonly message: string | ReactNode;
  readonly type: TypeOptions;
}) => void;

interface UseWaveGroupEditButtonsControllerProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly requestAuth: RequestAuth;
  readonly setToast: SetToast;
  readonly onWaveCreated: () => void;
}

interface WaveGroupEditButtonsController {
  readonly mutating: boolean;
  readonly updateWave: (
    body: ApiUpdateWaveRequest,
    opts?: { readonly skipAuth?: boolean | undefined }
  ) => Promise<boolean>;
}

export const useWaveGroupEditButtonsController = ({
  wave,
  type,
  requestAuth,
  setToast,
  onWaveCreated,
}: UseWaveGroupEditButtonsControllerProps): WaveGroupEditButtonsController => {
  const locale = useBrowserLocale();
  const [mutating, setMutating] = useState(false);
  const editWaveMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error, body) => {
      const groupId = body ? getGroupIdFromUpdateBody(body, type) : null;
      console.error("[WaveGroupEditButtons] Wave update failed", {
        waveId: wave.id,
        waveGroupType: type,
        groupId,
        error,
      });
      setToast({
        message: toErrorMessage(error),
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const updateWave = useCallback(
    async (
      body: ApiUpdateWaveRequest,
      opts?: { readonly skipAuth?: boolean | undefined }
    ): Promise<boolean> => {
      setMutating(true);
      if (!opts?.skipAuth) {
        const { success } = await requestAuth();
        if (!success) {
          setToast({
            type: "error",
            message:
              "Couldn't authenticate. Reconnect your wallet and try again.",
          });
          setMutating(false);
          return false;
        }
      }

      const scopedGroupId = getGroupIdFromUpdateBody(body, type);
      if (body.visibility.scope.group_id !== null || scopedGroupId !== null) {
        try {
          const validation = await validateWaveGroups(
            getWaveUpdateGroupValidationRequest(body, getValidationRoles(type))
          );
          if (!validation.valid) {
            setToast({
              type: "error",
              message: t(
                locale,
                "waves.create.groups.validation.invalidDescription"
              ),
            });
            setMutating(false);
            return false;
          }
        } catch {
          setToast({
            type: "error",
            message: t(locale, "waves.create.groups.validation.unavailable"),
          });
          setMutating(false);
          return false;
        }
      }

      await editWaveMutation.mutateAsync(body);
      return true;
    },
    [editWaveMutation, locale, requestAuth, setToast, type]
  );

  return { mutating, updateWave };
};
