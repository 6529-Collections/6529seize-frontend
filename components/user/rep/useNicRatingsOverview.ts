import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  PENDING_PROFILE_QUERY_VIEWER,
  useProfileQueryViewer,
} from "@/hooks/useProfileQueryViewer";
import { nicOverviewQueryOptions } from "@/services/api/profile-page-queries";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { RepDirection } from "./UserPageRep.helpers";

export function useNicRatingsOverview(
  profile: ApiIdentity,
  cicOverview: ApiCicOverview | null
) {
  const [direction, setDirection] = useState<RepDirection>("received");
  const identity = profile.query ?? profile.handle ?? profile.primary_wallet;
  const viewer = useProfileQueryViewer();
  const given = useQuery({
    ...nicOverviewQueryOptions(identity, "outgoing", viewer),
    enabled: direction === "given" && viewer !== PENDING_PROFILE_QUERY_VIEWER,
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
