"use client";

import { useAuth } from "@/components/auth/Auth";
import { fetchContentModeratorAccess } from "@/services/api/content-moderation-api";
import { clearPrivateModerationQueries } from "@/services/content-moderation/content-moderation-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "./useContentModerationStateScope";

export { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "./useContentModerationStateScope";

const MODERATOR_ACCESS_REFRESH_MS = 60_000;

// Access can only change mid-session for moderators: revocation is also pushed
// by the 401/403 handlers, and the manual-review indicator is live state. A
// profile already confirmed as a non-moderator has nothing to refresh, so it
// stops polling and picks up a new grant on its next stale mount.
const getModeratorAccessRefetchInterval = (query: {
  readonly state: {
    readonly data: { readonly moderator: boolean } | undefined;
  };
}): number | false =>
  query.state.data?.moderator === false ? false : MODERATOR_ACCESS_REFRESH_MS;

export const useContentModeratorAccess = () => {
  const { connectedProfile, activeProfileProxy, isDirectProfileSession } =
    useAuth();
  const queryClient = useQueryClient();
  const profileId =
    isDirectProfileSession === true && activeProfileProxy === null
      ? connectedProfile?.id
      : null;
  const previousProfileId = useRef(profileId);
  const query = useQuery({
    queryKey: [...CONTENT_MODERATOR_ACCESS_QUERY_KEY, profileId ?? null],
    queryFn: ({ signal }) => fetchContentModeratorAccess(signal),
    enabled: Boolean(profileId),
    staleTime: MODERATOR_ACCESS_REFRESH_MS,
    refetchInterval: profileId ? getModeratorAccessRefetchInterval : false,
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
