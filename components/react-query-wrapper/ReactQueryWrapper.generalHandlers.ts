import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "./query-keys";

const AUTH_SENSITIVE_QUERY_KEYS = [
  QueryKey.PROFILE,
  QueryKey.PROFILE_PREFERENCES,
  QueryKey.PROFILE_PROFILE_PROXIES,
  QueryKey.PROFILE_PROXY,
  QueryKey.IDENTITY_AVAILABLE_CREDIT,
  QueryKey.IDENTITY_MUTE_STATE,
  QueryKey.IDENTITY_NOTIFICATIONS,
  QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
  QueryKey.DM_DROPS_UNREAD,
  QueryKey.PROFILE_WAVE_ACTIVITY,
  QueryKey.WAVES_OVERVIEW,
  QueryKey.WAVES_V2,
  QueryKey.WAVE_SUBWAVES,
  QueryKey.OFFICIAL_WAVES,
  QueryKey.WAVES,
  QueryKey.WAVES_PUBLIC,
  QueryKey.WAVE,
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.DROP,
  QueryKey.FEED_ITEMS,
] as const;

const AUTH_SENSITIVE_QUERY_KEY_SET = new Set<QueryKey>(
  AUTH_SENSITIVE_QUERY_KEYS
);

const VIEWER_CONTEXT_QUERY_KEYS = [
  QueryKey.DROP,
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.PROFILE_DROPS,
  QueryKey.FEED_ITEMS,
] as const;

export const createGeneralQueryHandlers = (
  queryClient: QueryClient,
  invalidateWavesV2: () => void
) => {
  const invalidateAll = () => {
    queryClient.removeQueries({ queryKey: [QueryKey.WAVE] });
    queryClient.invalidateQueries();
  };
  const invalidateAuthSensitiveQueries = () => {
    VIEWER_CONTEXT_QUERY_KEYS.forEach((queryKey) => {
      queryClient.removeQueries({ queryKey: [queryKey] });
    });
    queryClient.invalidateQueries({
      predicate: (query) => {
        const [queryKey] = query.queryKey;
        return (
          typeof queryKey === "string" &&
          AUTH_SENSITIVE_QUERY_KEY_SET.has(queryKey as QueryKey)
        );
      },
    });
  };
  const invalidateNotifications = () => {
    queryClient
      .invalidateQueries({ queryKey: [QueryKey.IDENTITY_NOTIFICATIONS] })
      .catch(() => undefined);
    invalidateWavesV2();
  };
  const invalidateIdentityTdhStats = ({ identity }: { identity: string }) => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_TDH_STATS, identity.toLowerCase()],
    });
  };
  return {
    invalidateAll,
    invalidateAuthSensitiveQueries,
    invalidateIdentityTdhStats,
    invalidateNotifications,
  };
};
