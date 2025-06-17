"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import {
  TypedNotification,
  TypedNotificationsResponse,
} from "../types/feed.types";
import { ApiNotificationCause } from "../generated/models/ApiNotificationCause";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface UseNotificationsQueryProps {
  /**
   * If true, reverse the notifications order (e.g. for a "descending" / "newest first" display).
   */
  reverse?: boolean;

  /**
   * Only fetch notifications if we have a valid identity.
   * Used in "enabled" to avoid sending queries prematurely.
   */
  identity?: string | null;

  /**
   * Example usage where you only fetch if no active profile proxy is set.
   * Adjust or remove according to your own logic.
   */
  activeProfileProxy?: boolean;

  /**
   * How many notifications to fetch per page.
   */
  limit?: string;

  /**
   * The cause of the notifications to fetch.
   */
  cause?: ApiNotificationCause[] | null;
}

type NotificationsQueryParams = {
  limit: string;
  cause: ApiNotificationCause[] | null;
  pageParam?: number | null;
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
}: NotificationsQueryParams) => {
  const params: Record<string, string> = { limit };

  if (pageParam) {
    params.id_less_than = String(pageParam);
  }

  if (cause?.length) {
    params.cause = cause.join(",");
  }

  return await commonApiFetch<TypedNotificationsResponse>({
    endpoint: "notifications",
    params,
  });
};

export function useNotificationsQuery({
  reverse = false,
  identity,
  activeProfileProxy = false,
  limit = "30",
  cause = null,
}: UseNotificationsQueryProps) {
  const queryClient = useQueryClient();

  const [items, setItems] = useState<TypedNotification[]>([]);
  const [isInitialQueryDone, setIsInitialQueryDone] = useState(false);

  /**
   * OPTIONAL: Prefetch the first few pages of notifications.
   * This is similar to how `useMyStreamQuery` sets up prefetching.
   */
  queryClient.prefetchInfiniteQuery({
    queryKey: getIdentityNotificationsQueryKey(identity, limit, cause),
    queryFn: ({ pageParam }: { pageParam?: number | null }) =>
      fetchNotifications({ limit, cause, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    pages: 3,
    staleTime: 60000,
  });

  /**
   * Now the actual Infinite Query for notifications
   */
  const query = useInfiniteQuery({
    queryKey: getIdentityNotificationsQueryKey(identity, limit, cause),
    queryFn: ({ pageParam }: { pageParam: number | null }) =>
      fetchNotifications({ limit, cause, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    enabled: !!identity && !activeProfileProxy,
    staleTime: 60000,
  });

  useEffect(() => {
    setItems([]);
    setIsInitialQueryDone(false);
  }, [identity, cause]);

  /**
   * Flatten all pages and (optionally) reverse them. Store in local state.
   */
  useEffect(() => {
    if (!query.data) {
      return;
    }

    let data: TypedNotification[] = (
      query.data.pages as TypedNotificationsResponse[]
    ).flatMap((page) => page.notifications);

    if (reverse) {
      data = data.reverse();
    }

    setItems(data);
    setIsInitialQueryDone(true);
  }, [query.data, reverse]);

  // Return everything the query provides, plus our flattened items & readiness indicator.
  return {
    ...query,
    items,
    isInitialQueryDone,
  };
}

export function usePrefetchNotifications() {
  const queryClient = useQueryClient();

  return ({
    identity,
    cause = null,
    limit = "30",
  }: {
    identity: string | null;
    cause?: ApiNotificationCause[] | null;
    limit?: string;
  }) => {
    if (!identity) {
      return;
    }
    queryClient.prefetchInfiniteQuery({
      queryKey: getIdentityNotificationsQueryKey(identity, limit, cause),
      queryFn: ({ pageParam }: { pageParam?: number | null }) =>
        fetchNotifications({ limit, cause, pageParam }),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
      pages: 3,
      staleTime: 60000,
    });
  };
}
