"use client";

import { useAuth } from "@/components/auth/Auth";
import { fetchContentModeratorAccess } from "@/services/api/content-moderation-api";
import {
  BLOCK_ACTIVITY_QUERY_KEY,
  MODERATION_QUEUE_QUERY_KEY,
  SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
} from "@/services/content-moderation/content-moderation-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const CONTENT_MODERATOR_ACCESS_QUERY_KEY = [
  "content-moderation",
  "moderator-access",
] as const;

const MODERATOR_ACCESS_REFRESH_INTERVAL_MS = 60_000;

const PRIVATE_MODERATOR_QUERY_KEYS = [
  [...MODERATION_QUEUE_QUERY_KEY, "OPEN"],
  [...MODERATION_QUEUE_QUERY_KEY, "RESOLVED"],
  SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
  BLOCK_ACTIVITY_QUERY_KEY,
] as const;

export const useContentModeratorAccess = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const queryClient = useQueryClient();
  const hasModeratorIdentity =
    Boolean(connectedProfile?.id) && activeProfileProxy === null;

  useEffect(() => {
    if (hasModeratorIdentity) {
      return;
    }
    // Removing queries also cancels pending results, so a late response cannot
    // restore private data after switching to a proxy or signing out.
    queryClient.removeQueries({
      queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
    });
    for (const queryKey of PRIVATE_MODERATOR_QUERY_KEYS) {
      queryClient.removeQueries({ queryKey, exact: true });
    }
  }, [hasModeratorIdentity, queryClient]);

  return useQuery({
    queryKey: [
      ...CONTENT_MODERATOR_ACCESS_QUERY_KEY,
      hasModeratorIdentity ? connectedProfile?.id : null,
    ],
    queryFn: fetchContentModeratorAccess,
    enabled: hasModeratorIdentity,
    staleTime: 5 * 60 * 1000,
    refetchInterval: (query) =>
      query.state.data?.moderator === true
        ? MODERATOR_ACCESS_REFRESH_INTERVAL_MS
        : false,
    refetchIntervalInBackground: false,
    retry: false,
  });
};
