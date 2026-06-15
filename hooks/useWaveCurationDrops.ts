"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCurationDrop } from "@/generated/models/ApiCurationDrop";
import type { ApiCurationDropsPage } from "@/generated/models/ApiCurationDropsPage";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiReplyToDropResponse } from "@/generated/models/ApiReplyToDropResponse";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import {
  convertApiDropToExtendedDrop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";

const DEFAULT_CURATION_DROPS_PAGE_SIZE = 20;
const MAX_CURATION_DROPS_PAGE_SIZE = 100;
const MAX_CURATION_DROPS_PAGES = 100;

const getWaveMin = (wave: ApiWave): ApiWaveMin => ({
  id: wave.id,
  name: wave.name,
  picture: wave.picture,
  description_drop_id: wave.description_drop.id,
  last_drop_time: wave.last_drop_time,
  submission_type: wave.participation.submission_strategy?.type ?? null,
  authenticated_user_eligible_to_vote: wave.voting.authenticated_user_eligible,
  authenticated_user_eligible_to_participate:
    wave.participation.authenticated_user_eligible,
  authenticated_user_eligible_to_chat: wave.chat.authenticated_user_eligible,
  authenticated_user_admin: wave.wave.authenticated_user_eligible_for_admin,
  visibility_group_id: wave.visibility.scope.group?.id ?? null,
  participation_group_id: wave.participation.scope.group?.id ?? null,
  chat_group_id: wave.chat.scope.group?.id ?? null,
  voting_group_id: wave.voting.scope.group?.id ?? null,
  admin_group_id: wave.wave.admin_group.group?.id ?? null,
  voting_period_start: wave.voting.period?.min ?? null,
  voting_period_end: wave.voting.period?.max ?? null,
  voting_credit_type: wave.voting.credit_type,
  admin_drop_deletion_enabled: wave.wave.admin_drop_deletion_enabled,
  forbid_negative_votes: wave.voting.forbid_negative_votes,
  pinned: wave.pinned,
  identity_wave: wave.identity_wave,
});

const withWaveOnReplyTo = (
  replyTo: ApiReplyToDropResponse | undefined,
  wave: ApiWaveMin
): ApiReplyToDropResponse | undefined => {
  if (!replyTo?.drop) {
    return replyTo;
  }

  return {
    ...replyTo,
    drop: {
      ...replyTo.drop,
      wave,
    },
  } as ApiReplyToDropResponse;
};

const withWave = (
  drop: ApiCurationDrop | ApiDropWithoutWave,
  wave: ApiWaveMin
) =>
  ({
    ...drop,
    wave,
    reply_to: withWaveOnReplyTo(drop.reply_to, wave),
  }) as ApiDrop;

const processDrops = (
  pages: ApiCurationDropsPage[] | undefined,
  wave: ApiWave
): ExtendedDrop[] => {
  if (!pages) {
    return [];
  }

  const waveMin = getWaveMin(wave);
  const allDrops = pages.flatMap((page) => page.data);
  const orderedDrops = allDrops.some(
    (drop) => drop.drop_priority_order !== null
  )
    ? allDrops
    : [...allDrops].sort(
        (left, right) =>
          right.created_at - left.created_at || right.serial_no - left.serial_no
      );

  return orderedDrops.map((drop) =>
    convertApiDropToExtendedDrop(withWave(drop, waveMin))
  );
};

const fetchWaveCurationDropsPage = async ({
  waveId,
  curationId,
  page,
  pageSize,
}: {
  readonly waveId: string;
  readonly curationId: string;
  readonly page: number;
  readonly pageSize: number;
}): Promise<ApiCurationDropsPage> =>
  await commonApiFetch<ApiCurationDropsPage>({
    endpoint: `waves/${waveId}/curations/${curationId}/drops`,
    params: {
      page: page.toString(),
      page_size: pageSize.toString(),
    },
  });

export const fetchAllWaveCurationDrops = async ({
  wave,
  curationId,
  pageSize = MAX_CURATION_DROPS_PAGE_SIZE,
  maxPages = MAX_CURATION_DROPS_PAGES,
}: {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly pageSize?: number | undefined;
  readonly maxPages?: number | undefined;
}): Promise<ExtendedDrop[]> => {
  const normalizedMaxPages = Math.max(1, maxPages);
  const pages: ApiCurationDropsPage[] = [];
  let nextPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    if (pages.length >= normalizedMaxPages) {
      throw new Error(
        `Unable to load more than ${
          normalizedMaxPages * pageSize
        } curation drops.`
      );
    }

    const page = await fetchWaveCurationDropsPage({
      waveId: wave.id,
      curationId,
      page: nextPage,
      pageSize,
    });

    pages.push(page);
    hasNextPage = page.next;
    nextPage = page.page + 1;
  }

  return processDrops(pages, wave);
};

interface UseWaveCurationDropsProps {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly pageSize?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export function useWaveCurationDrops({
  wave,
  curationId,
  pageSize = DEFAULT_CURATION_DROPS_PAGE_SIZE,
  enabled = true,
}: UseWaveCurationDropsProps) {
  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS,
        {
          waveId: wave.id,
          curationId,
          pageSize,
          context: "wave-curation-drops",
        },
      ] as const,
    [curationId, pageSize, wave.id]
  );

  const {
    data,
    fetchNextPage: onFetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchWaveCurationDropsPage({
        waveId: wave.id,
        curationId,
        page: pageParam,
        pageSize,
      }),
    enabled: enabled && !!wave.id && !!curationId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await onFetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  const drops = useMemo(
    () => processDrops(data?.pages, wave),
    [data?.pages, wave]
  );
  const requestRefetch = useDebouncedQueryRefetch({
    refetch,
    isFetching,
    isFetchingNextPage,
  });

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        if (wave.id !== message.wave.id) {
          return;
        }

        requestRefetch();
      },
      [requestRefetch, wave.id]
    )
  );

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  };
}
