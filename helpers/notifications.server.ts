import type { QueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";

import { getIdentityQueryOptions } from "@/services/api/identity-query";
import {
  getIdentityNotificationsInfiniteQueryOptions,
  NOTIFICATIONS_PAGE_LIMIT,
} from "@/services/api/notifications-query";

const getWalletFromJwt = (headers: Record<string, string>): string | null => {
  const jwt = headers["Authorization"]?.split(" ")[1] ?? null;
  if (!jwt) {
    return null;
  }

  const decodedJwt = jwtDecode<{ readonly sub: string }>(jwt);
  return decodedJwt.sub;
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

  const profile = await queryClient.fetchQuery({
    ...getIdentityQueryOptions({
      handleOrWallet: wallet,
      headers,
    }),
    retry: false,
  });

  if (!profile.handle) {
    return;
  }

  await queryClient.prefetchInfiniteQuery({
    ...getIdentityNotificationsInfiniteQueryOptions({
      identity: profile.handle,
      limit: NOTIFICATIONS_PAGE_LIMIT,
      cause: null,
      headers,
    }),
    pages: 1,
  });
};
