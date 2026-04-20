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
import { getProfileWaveQueryKey } from "./useProfileWave";

type ProfileWaveAction =
  | {
      readonly type: "set";
      readonly waveId: string;
      readonly profileCurationId?: string | null | undefined;
    }
  | { readonly type: "clear" };

interface ProfileWaveIdentitySource {
  readonly query?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly normalised_handle?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
  readonly id?: string | null | undefined;
}

const getProfileIdentityKey = (
  profile: ProfileWaveIdentitySource | null
): string | null =>
  profile?.query ??
  profile?.handle ??
  profile?.primary_wallet ??
  profile?.primary_address ??
  profile?.id ??
  null;

const getProfileIdentityAliases = (
  ...profiles: readonly (ProfileWaveIdentitySource | null | undefined)[]
): string[] => {
  const aliases = new Set<string>();

  for (const profile of profiles) {
    const candidates = [
      profile?.query,
      profile?.handle,
      profile?.normalised_handle,
      profile?.primary_wallet,
      profile?.primary_address,
      profile?.id,
    ];

    for (const candidate of candidates) {
      const normalizedCandidate = candidate?.trim().toLowerCase() ?? "";
      if (normalizedCandidate.length > 0) {
        aliases.add(normalizedCandidate);
      }
    }
  }

  return [...aliases];
};

export function useProfileWaveMutation(profile: ApiIdentity | null) {
  const queryClient = useQueryClient();
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
      const aliases = getProfileIdentityAliases(profile, updatedProfile);
      for (const alias of aliases) {
        const queryKey = getProfileWaveQueryKey(alias);
        queryClient.setQueryData<ApiProfileWaveResponse>(queryKey, {
          profile_wave_id:
            action.type === "set"
              ? action.waveId
              : updatedProfile.profile_wave_id,
          profile_curation_id:
            action.type === "set" ? (action.profileCurationId ?? null) : null,
        });
      }
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
