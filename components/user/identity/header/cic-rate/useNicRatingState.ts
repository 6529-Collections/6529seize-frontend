"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiProfileRaterCicState } from "@/entities/IProfile";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";

export function useNicRatingState(identity: string, enabled = true) {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const rater = activeProfileProxy?.created_by.handle ?? address?.toLowerCase();
  return useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: identity.toLowerCase(),
        rater,
      },
    ],
    queryFn: ({ signal }) => {
      if (rater === undefined) {
        throw new Error("Cannot fetch NIC rating without a rater");
      }
      return commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${encodeURIComponent(identity)}/cic/rating/${rater}`,
        signal,
      });
    },
    enabled: enabled && !!address,
    staleTime: 0,
  });
}
