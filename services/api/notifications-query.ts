import type { QueryFunctionContext } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type {
  NotificationCause,
  TypedNotificationsResponse,
} from "@/types/feed.types";
import { fetchNotificationsV2 } from "./notifications-v2-api";

export const NOTIFICATIONS_PAGE_LIMIT = "30";
const NOTIFICATIONS_STALE_TIME_MS = 60_000;
const NOTIFICATIONS_QUERY_VERSION = "v2";

type NotificationsQueryOptionsParams = {
  readonly identity: string | null | undefined;
  readonly limit?: string | undefined;
  readonly cause?: NotificationCause[] | null | undefined;
  readonly headers?: Record<string, string> | undefined;
};

type NotificationsQueryKeyParams = {
  readonly identity: string | null | undefined;
  readonly limit?: string | undefined;
  readonly cause?: readonly string[] | null | undefined;
};

export const getIdentityNotificationsQueryKey = ({
  identity,
  limit = NOTIFICATIONS_PAGE_LIMIT,
  cause = null,
}: NotificationsQueryKeyParams) => {
  const normalizedIdentity =
    typeof identity === "string" ? identity.trim().toLowerCase() : identity;
  const normalizedCause =
    cause !== null && cause.length > 0
      ? [...cause].sort((left, right) => left.localeCompare(right)).join(",")
      : null;

  return [
    QueryKey.IDENTITY_NOTIFICATIONS,
    {
      identity: normalizedIdentity,
      limit,
      cause: normalizedCause,
      version: NOTIFICATIONS_QUERY_VERSION,
    },
  ] as const;
};

export const getIdentityNotificationsInfiniteQueryOptions = ({
  identity,
  limit = NOTIFICATIONS_PAGE_LIMIT,
  cause = null,
  headers,
}: NotificationsQueryOptionsParams) => {
  const queryKey = getIdentityNotificationsQueryKey({
    identity,
    limit,
    cause,
  });

  return {
    queryKey,
    queryFn: async ({
      pageParam,
      signal,
    }: QueryFunctionContext<typeof queryKey, number | null>) =>
      await fetchNotificationsV2({
        limit,
        cause,
        pageParam,
        signal,
        ...(headers === undefined ? {} : { headers }),
      }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage: TypedNotificationsResponse) =>
      lastPage.notifications.at(-1)?.id ?? null,
    staleTime: NOTIFICATIONS_STALE_TIME_MS,
  };
};
