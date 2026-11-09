import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { RepDirection } from "./UserPageRep.helpers";

export function useNicRatingsOverview(
  profile: ApiIdentity,
  cicOverview: ApiCicOverview | null
) {
  const [direction, setDirection] = useState<RepDirection>("received");
  const identity = profile.query ?? profile.handle ?? profile.primary_wallet;
  const given = useQuery({
    queryKey: [
      QueryKey.CIC_OVERVIEW,
      { handleOrWallet: identity.toLowerCase(), direction: "outgoing" },
    ],
    queryFn: () =>
      commonApiFetch<ApiCicOverview>({
        endpoint: `profiles/${encodeURIComponent(identity)}/cic/overview`,
        params: { direction: "outgoing" },
      }),
    enabled: direction === "given",
  });
  const overview = direction === "received" ? cicOverview : given.data;
  const score =
    direction === "received"
      ? (cicOverview?.total_cic ?? profile.cic)
      : given.data?.total_cic;
  return {
    direction,
    setDirection,
    overview: overview ?? null,
    score,
    isError: given.isError,
    retry: given.refetch,
  };
}
