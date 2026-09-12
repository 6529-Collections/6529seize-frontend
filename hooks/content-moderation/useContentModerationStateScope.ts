import { clearContentModerationState } from "@/services/content-moderation/content-moderation-state";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearPrivateModerationQueries,
  clearPersonalReportQueries,
  isPrivateModerationQuery,
} from "@/services/content-moderation/content-moderation-query";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { clearSubmissionRequestKeys } from "@/services/api/submission-request-key";

export const CONTENT_MODERATOR_ACCESS_QUERY_KEY = [
  "content-moderation",
  "moderator-access",
] as const;

export const useContentModerationStateScope = (
  connectedProfileId: string | null | undefined,
  proxyId?: string | null
) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    clearContentModerationState();
    clearSubmissionRequestKeys();
    const keepProfileId = proxyId ? null : connectedProfileId;
    clearPrivateModerationQueries(queryClient, keepProfileId);
    clearPersonalReportQueries(queryClient, keepProfileId);
    queryClient.removeQueries({
      queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
      predicate: (query) =>
        !keepProfileId || query.queryKey[2] !== keepProfileId,
    });
  }, [connectedProfileId, proxyId, queryClient]);

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type !== "updated" ||
          event.action.type !== "error" ||
          !isPrivateModerationQuery(event.query.queryKey as readonly unknown[])
        )
          return;
        const status = getStructuredApiErrorStatus(event.query.state.error);
        if (status !== 401 && status !== 403) return;
        clearPrivateModerationQueries(queryClient);
        queryClient.setQueriesData(
          { queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY },
          {
            moderator: false,
            has_open_reports: false,
            open_report_count: 0,
            resolved_report_count: 0,
            suspended_profile_count: 0,
          }
        );
      }),
    [queryClient]
  );
};
