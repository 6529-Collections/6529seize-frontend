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
import {
  getProfileWaveIdentity,
  setProfileWaveQueryData,
} from "./useProfileWave";

type ProfileWaveAction =
  | {
      readonly type: "set";
      readonly waveId: string;
      readonly profileCurationId?: string | null | undefined;
    }
  | { readonly type: "clear" };

export function useProfileWaveMutation(profile: ApiIdentity | null) {
  const queryClient = useQueryClient();
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
      setToast({
        message:
          action.type === "set"
            ? "Profile wave updated."
            : "Profile wave cleared.",
        type: "success",
      });
    },
    onError: (error: unknown, action) => {
      const fallbackMessage =
        action.type === "set"
          ? "Unable to update profile wave."
          : "Unable to clear profile wave.";
      setToast({
        type: "error",
        title:
          action.type === "set"
            ? "Couldn't update the profile wave."
            : "Couldn't clear the profile wave.",
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
    profileCurationId?: string | null
  ) =>
    await runProfileWaveMutation({
      type: "set",
      waveId,
      profileCurationId,
    });

  const clearSelectedProfileWave = async () =>
    await runProfileWaveMutation({
      type: "clear",
    });

  return {
    updateProfileWave,
    clearSelectedProfileWave,
    isPending: mutation.isPending,
    pendingAction: mutation.variables?.type ?? null,
  };
}
