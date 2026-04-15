"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  clearProfileWave,
  setProfileWave,
} from "@/services/api/profile-wave-api";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";

type ProfileWaveAction =
  | { readonly type: "set"; readonly waveId: string }
  | { readonly type: "clear" };

const getProfileIdentityKey = (profile: ApiIdentity | null): string | null =>
  profile?.query ??
  profile?.handle ??
  profile?.primary_wallet ??
  profile?.id ??
  null;

export function useProfileWaveMutation(profile: ApiIdentity | null) {
  const { requestAuth, setToast } = useAuth();
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);

  const mutation = useMutation({
    mutationFn: async (action: ProfileWaveAction) => {
      const identity = getProfileIdentityKey(profile);
      if (!identity) {
        throw new Error("Unable to determine the profile identity.");
      }

      if (action.type === "set") {
        return await setProfileWave({
          identity,
          waveId: action.waveId,
        });
      }

      return await clearProfileWave({ identity });
    },
    onSuccess: (updatedProfile, action) => {
      onProfileEdit({
        profile: updatedProfile,
        previousProfile: profile,
      });
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
        message: error instanceof Error ? error.message : fallbackMessage,
        type: "error",
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

  const updateProfileWave = async (waveId: string) =>
    await runProfileWaveMutation({
      type: "set",
      waveId,
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
