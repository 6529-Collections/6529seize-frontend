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
  identity?: string;

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
    queryKey: [QueryKey.IDENTITY_NOTIFICATIONS, { identity, limit, cause }],
    queryFn: async ({ pageParam }: { pageParam?: number | null }) => {
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
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    pages: 3,
    staleTime: 60000,
  });

  /**
   * Now the actual Infinite Query for notifications
   */
  const query = useInfiniteQuery({
    queryKey: [QueryKey.IDENTITY_NOTIFICATIONS, { identity, limit, cause }],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit,
      };
      if (pageParam) {
        params.id_less_than = `${pageParam}`;
      }
      if (cause) {
        params.cause = cause.join(",");
      }
      return await commonApiFetch<TypedNotificationsResponse>({
        endpoint: "notifications",
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    enabled: !!identity && !activeProfileProxy,
  });

  /**
   * Flatten all pages and (optionally) reverse them. Store in local state.
   */
  useEffect(() => {
    let data: TypedNotification[] = [];

    if (query.data?.pages) {
      // Each page is a TypedNotificationsResponse, so accumulate their `notifications`
      data = query.data.pages.flatMap((page) => page.notifications);

      if (reverse) {
        data = data.reverse();
      }
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
