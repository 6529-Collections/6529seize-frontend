"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { getDocumentationProfiles } from "@/services/api/artwork-documentation-api";

export const documentationQueryKey = (
  profileId: string | null | undefined,
  ...parts: string[]
) => ["artwork-documentation", profileId ?? "signed-out", ...parts] as const;

export function useArtworkDocumentationAccess() {
  const { connectedProfile, isAuthenticated, activeProfileProxy } = useAuth();
  const identity = connectedProfile?.id;
  const query = useQuery({
    queryKey: documentationQueryKey(
      identity,
      "access",
      activeProfileProxy?.id ?? "direct"
    ),
    queryFn: ({ signal }) => getDocumentationProfiles(signal),
    enabled: !!identity && isAuthenticated !== false,
    retry: false,
    staleTime: 30_000,
    gcTime: 0,
    meta: { persist: false },
  });
  return {
    ...query,
    enabled: query.data?.enabled === true,
    profiles: query.data?.profiles ?? [],
    selfServiceEnabled: query.data?.self_service_enabled === true,
  };
}
