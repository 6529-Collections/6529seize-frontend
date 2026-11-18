"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { groupProfileProxies } from "@/helpers/profile-proxy.helpers";
import { commonApiFetch } from "@/services/api/common-api";

/** Active proxies the connected profile has received from other profiles. */
export function useReceivedProfileProxies(
  profile: Pick<ApiIdentity, "id" | "query"> | null | undefined
): ApiProfileProxy[] {
  const { data: profileProxies } = useQuery<ApiProfileProxy[]>({
    queryKey: [
      QueryKey.PROFILE_PROFILE_PROXIES,
      { handleOrWallet: profile?.query },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileProxy[]>({
        endpoint: `profiles/${profile?.query ?? ""}/proxies/`,
      }),
    enabled: !!profile?.query,
  });

  const profileId = profile?.id ?? null;
  return useMemo(() => {
    return groupProfileProxies({
      profileProxies: profileProxies ?? [],
      onlyActive: true,
      profileId,
    }).received;
  }, [profileProxies, profileId]);
}
