import { QueryClient } from "@tanstack/react-query";

import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";
import {
  WAVE_DROPS_PARAMS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "../components/react-query-wrapper/utils/query-utils";
import { jwtDecode } from "jwt-decode";
import { getUserProfile } from "./server.helpers";
import { TypedFeedItem, TypedNotificationsResponse } from "../types/feed.types";
import { ApiWaveDropsFeed } from "../generated/models/ApiWaveDropsFeed";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

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
  await queryClient.prefetchInfiniteQuery({
    queryKey: [
      QueryKey.WAVES_OVERVIEW,
      {
        limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
        type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
        only_waves_followed_by_authenticated_user:
          WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {
        limit: `${WAVE_FOLLOWING_WAVES_PARAMS.limit}`,
        offset: `${pageParam}`,
        type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
        only_waves_followed_by_authenticated_user: `${WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user}`,
      };


      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
        headers,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) =>
      allPages.at(-1)?.length === WAVE_FOLLOWING_WAVES_PARAMS.limit
        ? allPages.flat().length
        : null,
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
        queryParams.serial_no_less_than = `${pageParam}`;
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
      const params: Record<string, string> = {
        limit: WAVE_DROPS_PARAMS.limit.toString(),
      };

      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      return await commonApiFetch<ApiWaveDropsFeed>({
        endpoint: `waves/${waveId}/drops`,
        params,
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
        params.serial_no_less_than = `${pageParam}`;
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
      { identity: handle, limit: "10" },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: "10",
      };
      if (pageParam) {
        params.id_less_than = `${pageParam}`;
      }
      return await commonApiFetch<TypedNotificationsResponse>({
        endpoint: `notifications`,
        params,
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
