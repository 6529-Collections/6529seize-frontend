import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { QueryClient } from "@tanstack/react-query";

export const MODERATION_QUEUE_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_REPORTS,
] as const;

export const BLOCKED_PROFILES_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_BLOCKED_PROFILES,
] as const;

const CONTENT_PRESENTATION_QUERY_ROOTS = [
  QueryKey.DROP,
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.PROFILE_DROPS,
  QueryKey.IDENTITY_NOTIFICATIONS,
  QueryKey.WAVES_V2,
] as const;

export const invalidateContentModerationPresentation = async (
  queryClient: QueryClient
): Promise<void> => {
  await Promise.allSettled(
    CONTENT_PRESENTATION_QUERY_ROOTS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    )
  );
};
