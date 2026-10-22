"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import {
  fetchModerationCheck,
  fetchModerationReportCheck,
  fetchModerationProfileCheck,
} from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";

export default function useModerationCheckDetail(
  profileId: string,
  source: "check" | "report" | "profile",
  id: string | null
) {
  const queryKey = [
    ...MODERATION_CHECKS_QUERY_KEY,
    profileId,
    "detail",
    source,
    id,
  ];
  const query = useQuery({
    queryKey,
    queryFn:
      id === null
        ? skipToken
        : ({ signal }) => {
            if (source === "report")
              return fetchModerationReportCheck(id, signal);
            if (source === "profile")
              return fetchModerationProfileCheck(id, signal);
            return fetchModerationCheck(id, signal);
          },
    retry: false,
    gcTime: 0,
  });
  return { query, queryKey };
}
