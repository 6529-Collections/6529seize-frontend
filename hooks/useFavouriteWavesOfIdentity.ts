"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";

interface UseFavouriteWavesOfIdentityProps {
  readonly identityKey: string | null;
  readonly limit?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export function useFavouriteWavesOfIdentity({
  identityKey,
  limit = 3,
  enabled = true,
}: UseFavouriteWavesOfIdentityProps) {
  const normalizedIdentityKey = identityKey?.trim() ?? null;
  const activeIdentityKey = normalizedIdentityKey ?? "";

  const query = useQuery<ApiWave[], Error>({
    queryKey: [
      QueryKey.IDENTITY_FAVOURITE_WAVES,
      { identity_key: normalizedIdentityKey, limit },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiWave[]>({
        endpoint: `waves-overview/favourites-of-identity/${encodeURIComponent(
          activeIdentityKey
        )}`,
        params: {
          limit: `${limit}`,
          offset: "0",
        },
      }),
    enabled: enabled && activeIdentityKey.length > 0,
    ...getDefaultQueryRetry(),
  });

  return {
    waves: query.data ?? [],
    status: query.status,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
