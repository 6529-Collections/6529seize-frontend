"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";

interface UseFavouriteWavesOfIdentityProps {
  readonly identityKey: string | null;
  readonly limit?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export function useFavouriteWavesOfIdentity({
  identityKey,
  limit = 5,
  enabled = true,
}: UseFavouriteWavesOfIdentityProps) {
  const normalizedIdentityKey = identityKey?.trim() ?? null;
  const activeIdentityKey = normalizedIdentityKey ?? "";

  const query = useQuery<SidebarWave[], Error>({
    queryKey: [
      QueryKey.IDENTITY_FAVOURITE_WAVES,
      { identity_key: normalizedIdentityKey, limit },
    ],
    queryFn: async () => {
      const page = await fetchWavesV2Page({
        view: ApiWavesV2ListType.Favourites,
        page: 1,
        pageSize: limit,
        identity: activeIdentityKey,
      });

      return page.waves;
    },
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
