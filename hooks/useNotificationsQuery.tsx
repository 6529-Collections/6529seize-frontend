"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import {
  TypedNotificationsResponse,
} from "@/types/feed.types";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface UseNotificationsQueryProps {
  /**
   * If true, reverse the notifications order (e.g. for a "descending" / "newest first" display).
   */
  readonly reverse?: boolean;

  /**
   * Only fetch notifications if we have a valid identity.
   * Used in "enabled" to avoid sending queries prematurely.
   */
  readonly identity?: string | null;

  /**
   * Example usage where you only fetch if no active profile proxy is set.
   * Adjust or remove according to your own logic.
   */
  readonly activeProfileProxy?: boolean;

  /**
   * How many notifications to fetch per page.
   */
  readonly limit?: string;

  /**
   * The cause of the notifications to fetch.
   */
  readonly cause?: ApiNotificationCause[] | null;
}

type NotificationsQueryParams = {
  limit: string;
  cause: ApiNotificationCause[] | null;
  pageParam?: number | null;
  signal?: AbortSignal;
};

const getIdentityNotificationsQueryKey = (
  identity: string | null | undefined,
  limit: string,
  cause: ApiNotificationCause[] | null
) => [QueryKey.IDENTITY_NOTIFICATIONS, { identity, limit, cause }] as const;

const fetchNotifications = async ({
  limit,
  cause,
  pageParam,
  signal,
}: NotificationsQueryParams) => {
  const params: Record<string, string> = { limit };

  if (pageParam != null) {
    params.id_less_than = String(pageParam);
  }

  if (cause?.length) {
    params.cause = cause.join(",");
  }

  return await commonApiFetch<TypedNotificationsResponse>({
    endpoint: "notifications",
    params,
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
    retry: (failureCount, error: unknown) => {
      const status =
        (error as any)?.status ??
        (error as any)?.response?.status ??
        (error as any)?.cause?.status;
      if (status === 401) return false;
      if (typeof error === "string" && /unauthorized/i.test(error)) return false;
      if (error instanceof Error && /unauthorized/i.test(error.message)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const items = useMemo(() => {
    if (!query.data) {
      return [];
    }

    const data = (
      query.data.pages as TypedNotificationsResponse[]
    ).flatMap((page) => page.notifications);

    return reverse ? [...data].reverse() : data;
  }, [query.data, reverse]);

  const isInitialQueryDone = query.isSuccess || query.isError;

  // Return everything the query provides, plus our flattened items & readiness indicator.
  return {
    ...query,
    items,
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
      cause?: ApiNotificationCause[] | null;
      limit?: string;
      pages?: number;
    }) => {
      if (!identity) {
        return;
      }
      queryClient.prefetchInfiniteQuery({
        queryKey: getIdentityNotificationsQueryKey(identity, limit, cause),
        queryFn: ({
          pageParam,
          signal,
        }: {
          pageParam?: number | null;
          signal?: AbortSignal;
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
