import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import type { QueryClient } from "@tanstack/react-query";

export const MODERATION_QUEUE_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_REPORTS,
] as const;

export const SUSPENDED_MODERATION_PROFILES_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_REPORTS,
  "suspended-profiles",
] as const;

export const BLOCK_ACTIVITY_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_REPORTS,
  "block-activity",
] as const;

export const PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_REPORTS,
  "public-profile-status",
] as const;

export const BLOCKED_PROFILES_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_BLOCKED_PROFILES,
] as const;

export const MY_CONTENT_MODERATION_REPORTS_QUERY_KEY = [
  QueryKey.CONTENT_MODERATION_REPORTS,
  "mine",
] as const;

const CONTENT_PRESENTATION_QUERY_ROOTS = [
  QueryKey.DROP,
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.PROFILE_DROPS,
  QueryKey.IDENTITY_NOTIFICATIONS,
  QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
  QueryKey.DM_DROPS_UNREAD,
  QueryKey.WAVES_OVERVIEW,
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

export const reconcileIdentityFollowingAfterBlockChange = async (
  queryClient: QueryClient,
  profileHandle: string | null | undefined
): Promise<void> => {
  if (profileHandle) {
    queryClient.setQueryData<ApiIdentitySubscriptionActions>(
      [QueryKey.IDENTITY_FOLLOWING_ACTIONS, profileHandle],
      { actions: [] }
    );
  }
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS],
    }),
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWERS],
    }),
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
    }),
  ]);
};
