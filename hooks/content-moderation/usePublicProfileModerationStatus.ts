"use client";

import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import { fetchPublicModeratedProfileStatus } from "@/services/api/content-moderation-api";
import { PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { useQuery } from "@tanstack/react-query";

export const usePublicProfileModerationStatus = (
  profileId: string | null | undefined
) => {
  const query = useQuery({
    queryKey: [...PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY, profileId],
    queryFn: () => fetchPublicModeratedProfileStatus(profileId!),
    enabled: Boolean(profileId),
    staleTime: 60_000,
    retry: false,
  });

  return {
    isSuspended: query.data?.status === ApiModeratedProfileStatus.Suspended,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
