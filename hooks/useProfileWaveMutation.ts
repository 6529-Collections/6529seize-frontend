"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  type ApiProfileWaveResponse,
  clearProfileWave,
  setProfileWave,
} from "@/services/api/profile-wave-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  getProfileWaveIdentity,
  setProfileWaveQueryData,
} from "./useProfileWave";

type ProfileWaveAction =
  | {
      readonly type: "set";
      readonly waveId: string;
      readonly profileCurationId?: string | null | undefined;
      readonly suppressSuccessToast?: boolean | undefined;
    }
  | {
      readonly type: "clear";
      readonly suppressSuccessToast?: boolean | undefined;
    };

export function useProfileWaveMutation(profile: ApiIdentity | null) {
  const queryClient = useQueryClient();
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useAuth();
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const mutation = useMutation({
    mutationFn: async (action: ProfileWaveAction) => {
      const identity = getProfileWaveIdentity(profile);
      if (identity.length === 0) {
        throw new Error("Unable to determine the profile identity.");
      }

      if (action.type === "set") {
        return await setProfileWave({
          identity,
          waveId: action.waveId,
          profileCurationId: action.profileCurationId,
        });
      }

      return await clearProfileWave({ identity });
    },
    onSuccess: (updatedProfile, action) => {
      onProfileEdit({
        profile: updatedProfile,
        previousProfile: profile,
      });
      const profileWaveData: ApiProfileWaveResponse = {
        profile_wave_id:
          action.type === "set"
            ? action.waveId
            : updatedProfile.profile_wave_id,
        profile_curation_id:
          action.type === "set" ? (action.profileCurationId ?? null) : null,
      };
      setProfileWaveQueryData(
        queryClient,
        [profile, updatedProfile],
        profileWaveData
      );
      if (!action.suppressSuccessToast) {
        setToast({
          message:
            action.type === "set"
              ? t(locale, "profileCuration.toast.updated")
              : t(locale, "profileCuration.toast.disconnected"),
          type: "success",
        });
      }
    },
    onError: (error: unknown, action) => {
      const fallbackMessage =
        action.type === "set"
          ? t(locale, "profileCuration.toast.updateFailed")
          : t(locale, "profileCuration.toast.disconnectFailed");
      setToast({
        type: "error",
        title:
          action.type === "set"
            ? t(locale, "profileCuration.toast.updateTitle")
            : t(locale, "profileCuration.toast.disconnectTitle"),
        description: "Please try again.",
        details: getToastErrorDetails(error, fallbackMessage),
      });
    },
  });

  const ensureAuthenticated = async (): Promise<boolean> => {
    const { success } = await requestAuth();
    return success;
  };

  const runProfileWaveMutation = async (
    action: ProfileWaveAction
  ): Promise<ApiIdentity | null> => {
    if (!(await ensureAuthenticated())) {
      return null;
    }

    try {
      return await mutation.mutateAsync(action);
    } catch {
      return null;
    }
  };

  const updateProfileWave = async (
    waveId: string,
    profileCurationId?: string | null,
    options?: { readonly suppressSuccessToast?: boolean | undefined }
  ) =>
    await runProfileWaveMutation({
      type: "set",
      waveId,
      profileCurationId,
      suppressSuccessToast: options?.suppressSuccessToast,
    });

  const updateProfileWaveOrThrow = async (
    waveId: string,
    profileCurationId?: string | null,
    options?: { readonly suppressSuccessToast?: boolean | undefined }
  ): Promise<ApiIdentity> => {
    if (!(await ensureAuthenticated())) {
      throw new Error("Authentication was cancelled.");
    }

    return await mutation.mutateAsync({
      type: "set",
      waveId,
      profileCurationId,
      suppressSuccessToast: options?.suppressSuccessToast,
    });
  };

  const clearSelectedProfileWave = async (options?: {
    readonly suppressSuccessToast?: boolean | undefined;
  }) =>
    await runProfileWaveMutation({
      type: "clear",
      suppressSuccessToast: options?.suppressSuccessToast,
    });

  return {
    updateProfileWave,
    updateProfileWaveOrThrow,
    clearSelectedProfileWave,
    isPending: mutation.isPending,
    pendingAction: mutation.variables?.type ?? null,
  };
}
