"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getIdentityQueryOptions } from "@/services/api/identity-query";

export function useSidebarIdentity(address: string | undefined) {
  const { data, isLoading, isError, isFetching, refetch } = useQuery<
    ApiIdentity | undefined
  >({
    ...getIdentityQueryOptions({ handleOrWallet: address ?? "" }),
    enabled: !!address,
    retry: 3,
  });
  return { profile: data ?? null, isLoading, isError, isFetching, refetch };
}
