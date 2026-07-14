import type { QueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";

import { getIdentityQueryOptions } from "@/services/api/identity-query";
import {
  getIdentityNotificationsInfiniteQueryOptions,
  NOTIFICATIONS_PAGE_LIMIT,
} from "@/services/api/notifications-query";
import {
  getServerRouteAuthCohort,
  SERVER_ROUTE_SPAN_NAMES,
  traceServerRouteData,
} from "@/utils/monitoring/serverRouteTelemetry";

const getWalletFromJwt = (headers: Record<string, string>): string | null => {
  const jwt = headers["Authorization"]?.split(" ")[1] ?? null;
  if (!jwt) {
    return null;
  }

  try {
    const decodedJwt = jwtDecode<{ readonly sub?: unknown }>(jwt);
    return typeof decodedJwt.sub === "string" && decodedJwt.sub.length > 0
      ? decodedJwt.sub
      : null;
  } catch {
    return null;
  }
};

export const prefetchNotificationsPageData = async ({
  queryClient,
  headers,
}: {
  readonly queryClient: QueryClient;
  readonly headers: Record<string, string>;
}) => {
  const wallet = getWalletFromJwt(headers);
  if (!wallet) {
    return;
  }

  const authCohort = getServerRouteAuthCohort(headers);
  const profile = await traceServerRouteData(
    {
      name: SERVER_ROUTE_SPAN_NAMES.notificationsProfilePrefetch,
      routeFamily: "/notifications",
      dataPath: "profile",
      apiRequestCount: 1,
      authCohort,
    },
    () =>
      queryClient.fetchQuery({
        ...getIdentityQueryOptions({
          handleOrWallet: wallet,
          headers,
        }),
        retry: false,
      })
  );

  if (!profile.handle) {
    return;
  }

  try {
    await traceServerRouteData(
      {
        name: SERVER_ROUTE_SPAN_NAMES.notificationsFeedPrefetch,
        routeFamily: "/notifications",
        dataPath: "notifications_feed",
        apiRequestCount: 1,
        authCohort,
      },
      () =>
        queryClient.fetchInfiniteQuery({
          ...getIdentityNotificationsInfiniteQueryOptions({
            identity: profile.handle,
            limit: NOTIFICATIONS_PAGE_LIMIT,
            cause: null,
            headers,
          }),
          pages: 1,
        })
    );
  } catch {
    // Notifications prefetch is best-effort; the client query owns recovery.
  }
};
