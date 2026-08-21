"use client";

import { useAuth } from "@/components/auth/Auth";
import { fetchContentModeratorAccess } from "@/services/api/content-moderation-api";
import { useQuery } from "@tanstack/react-query";

const CONTENT_MODERATOR_ACCESS_QUERY_KEY = [
  "content-moderation",
  "moderator-access",
] as const;

export const useContentModeratorAccess = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  return useQuery({
    queryKey: [
      ...CONTENT_MODERATOR_ACCESS_QUERY_KEY,
      connectedProfile?.id ?? null,
    ],
    queryFn: fetchContentModeratorAccess,
    enabled: Boolean(connectedProfile?.id) && activeProfileProxy === null,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
