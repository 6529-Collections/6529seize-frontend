import { useQuery } from "@tanstack/react-query";
import { fetchModerationCounts } from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";

export function useModerationReviewCounts(
  profileId: string | null | undefined,
  enabled: boolean,
  caseCount: number | undefined
) {
  const query = useQuery({
    queryKey: [...MODERATION_CHECKS_QUERY_KEY, profileId, "counts"],
    queryFn: ({ signal }) => fetchModerationCounts(signal),
    enabled,
    refetchInterval: 60_000,
    retry: false,
    gcTime: 0,
  });
  return {
    ...query,
    needsReviewCount: enabled ? caseCount : undefined,
  };
}
