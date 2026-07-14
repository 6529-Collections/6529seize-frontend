"use client";

import { groupReactionNotifications } from "@/components/brain/notifications/utils/groupReactionNotifications";
import {
  getIdentityNotificationsInfiniteQueryOptions,
  NOTIFICATIONS_PAGE_LIMIT,
} from "@/services/api/notifications-query";
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

export function useNotificationsQuery({
  reverse = false,
  identity,
  activeProfileProxy = false,
  limit = NOTIFICATIONS_PAGE_LIMIT,
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
    ...getIdentityNotificationsInfiniteQueryOptions({
      identity,
      limit,
      cause,
    }),
    enabled: !!identity && !activeProfileProxy,
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
      const record = error as {
        status?: unknown;
        response?: { status?: unknown };
        cause?: { status?: unknown };
      } | null;
      const status =
        record?.status ?? record?.response?.status ?? record?.cause?.status;
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
      limit = NOTIFICATIONS_PAGE_LIMIT,
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
        ...getIdentityNotificationsInfiniteQueryOptions({
          identity,
          limit,
          cause: (cause?.length ?? 0) > 0 ? cause : null,
        }),
        pages,
      });
    },
    [queryClient]
  );
}
