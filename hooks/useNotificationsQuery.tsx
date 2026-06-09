"use client";

import { groupReactionNotifications } from "@/components/brain/notifications/utils/groupReactionNotifications";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";
import type {
  NotificationCause,
  NotificationDisplayItem,
  TypedNotificationsResponse,
} from "@/types/feed.types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

interface UseNotificationsQueryProps {
  /**
   * If true, reverse the notifications order (e.g. for a "descending" / "newest first" display).
   */
  readonly reverse?: boolean | undefined;

  /**
   * Only fetch notifications if we have a valid identity.
   * Used in "enabled" to avoid sending queries prematurely.
   */
  readonly identity?: string | null | undefined;

  /**
   * Example usage where you only fetch if no active profile proxy is set.
   * Adjust or remove according to your own logic.
   */
  readonly activeProfileProxy?: boolean | undefined;

  /**
   * How many notifications to fetch per page.
   */
  readonly limit?: string | undefined;

  /**
   * The cause of the notifications to fetch (include filter).
   */
  readonly cause?: NotificationCause[] | null | undefined;
}

type NotificationsQueryParams = {
  limit: string;
  cause: NotificationCause[] | null;
  pageParam?: number | null | undefined;
  signal?: AbortSignal | undefined;
};

const getIdentityNotificationsQueryKey = (
  identity: string | null | undefined,
  limit: string,
  cause: NotificationCause[] | null
) =>
  [
    QueryKey.IDENTITY_NOTIFICATIONS,
    {
      identity,
      limit,
      cause: cause?.length
        ? [...cause].sort((a, b) => a.localeCompare(b)).join(",")
        : null,
      version: "v2",
    },
  ] as const;

const fetchNotifications = async ({
  limit,
  cause,
  pageParam,
  signal,
}: NotificationsQueryParams) => {
  return await fetchNotificationsV2({
    limit,
    cause,
    pageParam,
    signal,
  });
};

export function useNotificationsQuery({
  reverse = false,
  identity,
  activeProfileProxy = false,
  limit = "30",
  cause = null,
}: UseNotificationsQueryProps) {
  const prefetch = usePrefetchNotifications();
  const normalizedIdentity = identity?.trim().toLowerCase() ?? null;

  /**
   * OPTIONAL: Prefetch the first few pages of notifications.
   * This is similar to how `useMyStreamQuery` sets up prefetching.
   */
  useEffect(() => {
    if (!identity || activeProfileProxy) {
      return;
    }

    prefetch({ identity, limit, cause, pages: 1 });
  }, [prefetch, identity, activeProfileProxy, limit, cause]);

  /**
   * Now the actual Infinite Query for notifications
   */
  const query = useInfiniteQuery({
    queryKey: getIdentityNotificationsQueryKey(identity, limit, cause),
    queryFn: ({
      pageParam,
      signal,
    }: {
      pageParam: number | null;
      signal: AbortSignal | undefined;
    }) => fetchNotifications({ limit, cause, pageParam, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    enabled: !!identity && !activeProfileProxy,
    staleTime: 60000,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey?.[1] as
        | { identity?: string | null }
        | undefined;
      const previousIdentity =
        typeof previousParams?.identity === "string"
          ? previousParams.identity.trim().toLowerCase()
          : null;

      if (previousIdentity === normalizedIdentity) {
        return previousData;
      }

      return undefined;
    },
    retry: (failureCount, error: unknown) => {
      const status =
        (error as any)?.status ??
        (error as any)?.response?.status ??
        (error as any)?.cause?.status;
      if (status === 401) return false;
      if (typeof error === "string" && /unauthorized/i.test(error))
        return false;
      if (error instanceof Error && /unauthorized/i.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const rawItems = useMemo(() => {
    if (!query.data) {
      return [];
    }
    const data = (query.data.pages as TypedNotificationsResponse[]).flatMap(
      (page) => page.notifications
    );
    return reverse ? [...data].reverse() : data;
  }, [query.data, reverse]);

  const items = useMemo<NotificationDisplayItem[]>(() => {
    if (!query.data) return [];
    const notifications = (
      query.data.pages as TypedNotificationsResponse[]
    ).flatMap((page) => page.notifications);
    const grouped = groupReactionNotifications(notifications);
    return reverse ? [...grouped].reverse() : grouped;
  }, [query.data, reverse]);

  const isInitialQueryDone = query.isSuccess || query.isError;

  return {
    ...query,
    items,
    rawItems,
    isInitialQueryDone,
  };
}

export function usePrefetchNotifications() {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      identity,
      cause = null,
      limit = "30",
      pages = 3,
    }: {
      identity: string | null;
      cause?: NotificationCause[] | null | undefined;
      limit?: string | undefined;
      pages?: number | undefined;
    }) => {
      if (!identity) {
        return;
      }
      queryClient.prefetchInfiniteQuery({
        queryKey: getIdentityNotificationsQueryKey(
          identity,
          limit,
          cause?.length ? cause : null
        ),
        queryFn: ({
          pageParam,
          signal,
        }: {
          pageParam?: number | null | undefined;
          signal?: AbortSignal | undefined;
        }) => fetchNotifications({ limit, cause, pageParam, signal }),
        initialPageParam: null,
        getNextPageParam: (lastPage) =>
          lastPage.notifications.at(-1)?.id ?? null,
        pages,
        staleTime: 60000,
      });
    },
    [queryClient]
  );
}
