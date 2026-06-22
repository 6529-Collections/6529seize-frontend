import type { QueryClient } from "@tanstack/react-query";

import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  WAVE_DROPS_PARAMS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { jwtDecode } from "jwt-decode";
import { getUserProfile } from "./server.helpers";
import type { TypedFeedItem } from "@/types/feed.types";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  fetchWavesV2Page,
  getWavesV2OverviewQueryKeyParams,
} from "@/services/api/waves-v2-api";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";

const getWalletFromJwt = (headers: Record<string, string>): string | null => {
  const jwt = headers["Authorization"]?.split(" ")[1] ?? null;
  if (!jwt) {
    return null;
  }

  const decodedJwt = jwtDecode<{
    id: string;
    sub: string;
    iat: number;
    exp: number;
  }>(jwt);
  return decodedJwt.sub;
};

const getHandleFromJwt = async (
  headers: Record<string, string>
): Promise<string | null> => {
  const wallet = getWalletFromJwt(headers);
  if (!wallet) return null;
  const profile = await getUserProfile({ user: wallet, headers });
  return profile.handle ?? null;
};

const prefetchAuthenticatedWavesOverview = async ({
  queryClient,
  headers,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
}) => {
  const queryKeyParams = getWavesV2OverviewQueryKeyParams({
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    overviewType: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    following:
      WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
    directMessage: false,
  });

  await queryClient.prefetchInfiniteQuery({
    queryKey: [QueryKey.WAVES_V2, queryKeyParams],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      return await fetchWavesV2Page({
        page: pageParam,
        pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
        overviewType: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
        following:
          WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
        directMessage: false,
        headers,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    pages: 1,
    staleTime: 60000,
  });
};

const prefetchAuthenticatedWaves = async ({
  queryClient,
  headers,
  handle,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  handle: string;
}) => {
  await queryClient.prefetchInfiniteQuery({
    queryKey: [
      QueryKey.WAVES,
      {
        author: handle,
        limit: 20,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {
        limit: "20",
        author: handle,
      };

      if (pageParam) {
        queryParams["serial_no_less_than"] = `${pageParam}`;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params: queryParams,
        headers,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    pages: 1,
    staleTime: 60000,
  });
};

const prefetchAuthenticatedWaveFeedItems = async ({
  queryClient,
  headers,
  waveId,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  waveId: string | null;
}) => {
  await queryClient.prefetchInfiniteQuery({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId,
        limit: WAVE_DROPS_PARAMS.limit,
        dropId: null,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      return await fetchWaveDropsFeedV2({
        waveId: waveId!,
        limit: WAVE_DROPS_PARAMS.limit,
        serialNoLimit: pageParam,
        headers,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
    pages: 1,
    staleTime: 60000,
  });
};

const prefetchAuthenticatedGlobalFeedItems = async ({
  queryClient,
  headers,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
}) => {
  await queryClient.prefetchInfiniteQuery({
    queryKey: [QueryKey.FEED_ITEMS],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {};
      if (pageParam) {
        params["serial_no_less_than"] = `${pageParam}`;
      }
      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
        headers,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    pages: 1,
    staleTime: 60000,
  });
};

const prefetchAuthenticatedFeedItems = async ({
  queryClient,
  headers,
  waveId,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  waveId: string | null;
}) => {
  if (waveId) {
    await prefetchAuthenticatedWaveFeedItems({
      queryClient,
      headers,
      waveId,
    });
  } else {
    await prefetchAuthenticatedGlobalFeedItems({
      queryClient,
      headers,
    });
  }
};

const prefetchAuthenticatedWave = async ({
  queryClient,
  headers,
  waveId,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  waveId: string | null;
}) => {
  if (!waveId) {
    return;
  }
  await queryClient.prefetchQuery({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () => {
      return await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
        headers,
      });
    },
    staleTime: 60000,
  });
};

const prefetchAuthenticatedMyStreamContext = async ({
  queryClient,
  headers,
  handle,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  handle: string;
}) => {
  await Promise.all([
    prefetchAuthenticatedWavesOverview({ queryClient, headers }),
    prefetchAuthenticatedWaves({ queryClient, headers, handle }),
  ]);
};

const prefetchAuthenticatedStreamQueries = async ({
  queryClient,
  headers,
  waveId,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  waveId: string | null;
}) => {
  await Promise.all([
    prefetchAuthenticatedFeedItems({ queryClient, headers, waveId }),
    prefetchAuthenticatedWave({ queryClient, headers, waveId }),
  ]);
};

export const prefetchWavesOverview = async ({
  queryClient,
  headers,
  waveId,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  waveId: string | null;
}) => {
  const handle = await getHandleFromJwt(headers);
  if (handle) {
    const params = {
      queryClient,
      headers,
      handle,
      waveId,
    };
    await Promise.all([
      prefetchAuthenticatedStreamQueries(params),
      prefetchAuthenticatedMyStreamContext(params),
    ]);
  }
};

const prefetchAuthenticatedNotificationsItems = async ({
  queryClient,
  headers,
  handle,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
  handle: string;
}) => {
  await queryClient.prefetchInfiniteQuery({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: handle, limit: "10", cause: null, version: "v2" },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      return await fetchNotificationsV2({
        limit: "10",
        pageParam,
        headers,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    pages: 1,
    staleTime: 60000,
  });
};

export const prefetchAuthenticatedNotifications = async ({
  queryClient,
  headers,
}: {
  queryClient: QueryClient;
  headers: Record<string, string>;
}) => {
  const handle = await getHandleFromJwt(headers);

  if (!handle) return;
  await Promise.all([
    prefetchAuthenticatedNotificationsItems({
      queryClient,
      headers,
      handle,
    }),
    prefetchAuthenticatedMyStreamContext({ queryClient, headers, handle }),
  ]);
};
