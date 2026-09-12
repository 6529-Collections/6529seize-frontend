"use client";

import { useAuth } from "@/components/auth/Auth";
import { fetchContentModeratorAccess } from "@/services/api/content-moderation-api";
import { clearPrivateModerationQueries } from "@/services/content-moderation/content-moderation-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "./useContentModerationStateScope";

export { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "./useContentModerationStateScope";

export const useContentModeratorAccess = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const queryClient = useQueryClient();
  const profileId = activeProfileProxy === null ? connectedProfile?.id : null;
  const previousProfileId = useRef(profileId);
  const query = useQuery({
    queryKey: [...CONTENT_MODERATOR_ACCESS_QUERY_KEY, profileId ?? null],
    queryFn: ({ signal }) => fetchContentModeratorAccess(signal),
    enabled: Boolean(profileId),
    staleTime: 0,
    refetchInterval: profileId ? 60_000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  useEffect(() => {
    if (!profileId || previousProfileId.current !== profileId) {
      clearPrivateModerationQueries(queryClient, profileId);
      queryClient.removeQueries({
        queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
        predicate: (entry) => entry.queryKey[2] !== profileId,
      });
    }
    previousProfileId.current = profileId;
  }, [profileId, queryClient]);

  useEffect(() => {
    if (query.isError || query.data?.moderator === false) {
      clearPrivateModerationQueries(queryClient);
    }
  }, [query.isError, query.data?.moderator, queryClient]);

  // A failed refresh must not leave stale authorization on screen.
  return {
    ...query,
    data: query.isError || !profileId ? undefined : query.data,
  };
};
