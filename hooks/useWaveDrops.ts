import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

import { useEffect, useState } from "react";
import { Wave } from "../generated/models/Wave";
import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import { WaveDropsFeed } from "../generated/models/WaveDropsFeed";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { generateUniqueKeys } from "../helpers/waves/wave-drops.helpers";
import { useDebounce } from "react-use";
import { mapToExtendedDrops } from "../helpers/waves/wave-drops.helpers";

const REQUEST_SIZE = 20;
const POLLING_DELAY = 3000; // 3 seconds delay

export function useWaveDrops(wave: Wave, rootDropId: string | null, connectedProfileHandle: string | undefined) {
  const [drops, setDrops] = useState<ExtendedDrop[]>([]);
  const [haveNewDrops, setHaveNewDrops] = useState(false);
  const [canPoll, setCanPoll] = useState(false);
  const [delayedPollingResult, setDelayedPollingResult] = useState<WaveDropsFeed | undefined>(undefined);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: wave.id,
        limit: REQUEST_SIZE,
        dropId: rootDropId,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: REQUEST_SIZE.toString(),
      };
      if (rootDropId) {
        params.drop_id = rootDropId;
      }
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      return await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${wave.id}/drops`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
    placeholderData: keepPreviousData,
    enabled: !!connectedProfileHandle,
  });

  useEffect(() => {
    setDrops((prev) => {
      const newDrops = data?.pages ? mapToExtendedDrops(data.pages, prev) : [];
      return generateUniqueKeys(newDrops, prev);
    });
  }, [data]);

  useDebounce(() => setCanPoll(true), 10000, [data]);
  useEffect(() => setCanPoll(false), [data]);

  const { data: pollingResult } = useQuery({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: wave.id,
        limit: 1,
        dropId: rootDropId,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
      };
      if (rootDropId) {
        params.drop_id = rootDropId;
      }
      return await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${wave.id}/drops`,
        params,
      });
    },
    enabled: !haveNewDrops && canPoll,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (pollingResult) {
      const timer = setTimeout(() => {
        setDelayedPollingResult(pollingResult);
      }, POLLING_DELAY);

      return () => clearTimeout(timer);
    }
  }, [pollingResult]);

  useEffect(() => {
    if (delayedPollingResult !== undefined) {
      if (delayedPollingResult.drops.length > 0) {
        const latestPolledDrop = delayedPollingResult.drops[0];

        if (drops.length > 0) {
          const latestExistingDrop = drops.at(-1);

          const polledCreatedAt = new Date(
            latestPolledDrop.created_at
          ).getTime();
          const existingCreatedAt = new Date(
            latestExistingDrop?.created_at ?? 0
          ).getTime();

          setHaveNewDrops(polledCreatedAt > existingCreatedAt);
        } else {
          setHaveNewDrops(true);
        }
      } else {
        setHaveNewDrops(false);
      }
    }
  }, [delayedPollingResult, drops]);

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    haveNewDrops,
  };
}