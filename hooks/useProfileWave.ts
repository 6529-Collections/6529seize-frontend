"use client";

import {
  getProfileWave,
  type ApiProfileWaveResponse,
} from "@/services/api/profile-wave-api";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface ProfileWaveIdentitySource {
  readonly query?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly normalised_handle?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
  readonly id?: string | null | undefined;
}

const normalizeProfileWaveIdentity = (
  identity: string | null | undefined
): string => identity?.trim().toLowerCase() ?? "";

const getProfileWaveQueryKey = (identity: string | null | undefined) =>
  ["profile-wave", normalizeProfileWaveIdentity(identity)] as const;

export const getProfileWaveIdentity = (
  profile: ProfileWaveIdentitySource | null | undefined
): string =>
  normalizeProfileWaveIdentity(
    profile?.query ??
      profile?.handle ??
      profile?.primary_wallet ??
      profile?.primary_address ??
      profile?.id ??
      null
  );

const getProfileWaveIdentityAliases = (
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
      const identity = normalizeProfileWaveIdentity(candidate);
      if (identity.length > 0) {
        aliases.add(identity);
      }
    }
  }

  return [...aliases];
};

export const setProfileWaveQueryData = (
  queryClient: QueryClient,
  profiles: readonly (ProfileWaveIdentitySource | null | undefined)[],
  data: ApiProfileWaveResponse
): void => {
  for (const identity of getProfileWaveIdentityAliases(...profiles)) {
    queryClient.setQueryData<ApiProfileWaveResponse>(
      getProfileWaveQueryKey(identity),
      data
    );
  }

  if (data.profile_wave_id === null) {
    return;
  }

  queryClient.setQueriesData<ApiProfileWaveResponse>(
    { queryKey: ["profile-wave"] },
    (current) =>
      current?.profile_wave_id === data.profile_wave_id ? data : current
  );
};

export const invalidateProfileWaveQueries = async (
  queryClient: QueryClient,
  profiles: readonly (ProfileWaveIdentitySource | null | undefined)[]
): Promise<void> => {
  await Promise.all(
    getProfileWaveIdentityAliases(...profiles).map((identity) =>
      queryClient.invalidateQueries({
        queryKey: getProfileWaveQueryKey(identity),
      })
    )
  );
};

export function useProfileWave({
  identity,
  initialProfileWave,
  enabled = true,
}: {
  readonly identity: string | null | undefined;
  readonly initialProfileWave?: ApiProfileWaveResponse | undefined;
  readonly enabled?: boolean | undefined;
}) {
  const normalizedIdentity = useMemo(
    () => normalizeProfileWaveIdentity(identity),
    [identity]
  );

  return useQuery<ApiProfileWaveResponse>({
    queryKey: getProfileWaveQueryKey(normalizedIdentity),
    queryFn: async ({ signal }) =>
      await getProfileWave({
        identity: normalizedIdentity,
        signal,
      }),
    enabled: enabled && normalizedIdentity.length > 0,
    staleTime: 60 * 1000,
    ...(initialProfileWave === undefined
      ? {}
      : { initialData: initialProfileWave, initialDataUpdatedAt: 0 }),
  });
}
