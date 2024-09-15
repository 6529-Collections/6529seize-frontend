import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import DropListWrapper from "../../../drops/view/DropListWrapper";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { commonApiFetch } from "../../../../services/api/common-api";
import { Drop } from "../../../../generated/models/Drop";
import { ActiveDropState } from "../WaveDetailedContent";
import { WaveDropsFeed } from "../../../../generated/models/WaveDropsFeed";

const REQUEST_SIZE = 20;
const POLLING_DELAY = 3000; // 3 seconds delay

interface WaveDropsProps {
  readonly wave: Wave;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
}

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  rootDropId,
}: WaveDropsProps) {
  const { connectedProfile } = useContext(AuthContext);
  const [isInitialQueryDone, setIsInitialQueryDone] = useState(false);
  const [delayedPollingResult, setDelayedPollingResult] = useState<
    WaveDropsFeed | undefined
  >(undefined);
  

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
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
      console.log('ym running')
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
    enabled: !!connectedProfile?.profile?.handle,
  });

  const [drops, setDrops] = useState<Drop[]>([]);
  useEffect(() => {
    setDrops(
      data?.pages.flatMap((page) =>
        page.drops.map((drop) => ({
          ...drop,
          wave: page.wave,
        }))
      ) ?? []
    );
    if (data) {
      setIsInitialQueryDone(true);
    }
  }, [data]);

  const [haveNewDrops, setHaveNewDrops] = useState(false);

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
    enabled: isInitialQueryDone && !haveNewDrops,
    refetchInterval: 30000,
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
    if (isInitialQueryDone && delayedPollingResult !== undefined) {
      if (delayedPollingResult.drops.length > 0) {
        const latestPolledDrop = delayedPollingResult.drops[0];

        if (drops.length > 0) {
          const latestExistingDrop = drops[0];

          const polledCreatedAt = new Date(
            latestPolledDrop.created_at
          ).getTime();
          const existingCreatedAt = new Date(
            latestExistingDrop.created_at
          ).getTime();

          setHaveNewDrops(polledCreatedAt > existingCreatedAt);
        } else {
          setHaveNewDrops(true);
        }
      } else {
        setHaveNewDrops(false);
      }
    }
  }, [delayedPollingResult, drops, isInitialQueryDone]);

  const onBottomIntersection = (state: boolean) => {
    if (drops.length < REQUEST_SIZE) {
      return;
    }
    if (!state) {
      return;
    }
    if (status === "pending") {
      return;
    }
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    fetchNextPage();
  };

  const onRefresh = () => {
    refetch();
  };

  return (
    <div>
      {haveNewDrops && (
        <div className="tw-sticky tw-top-20 tw-left-0 tw-right-0 tw-z-10 tw-flex tw-justify-center">
          <button
            onClick={onRefresh}
            className="tw-border-none tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-shadow-md tw-cursor-pointer tw-transition-all hover:tw-bg-blue-600"
          >
            New drops available
          </button>
        </div>
      )}
      <DropListWrapper
        drops={drops}
        loading={isFetching}
        showWaveInfo={false}
        rootDropId={rootDropId}
        onBottomIntersection={onBottomIntersection}
        showReplyAndQuote={true}
        onReply={onReply}
        onQuote={onQuote}
        activeDrop={activeDrop}
      />
    </div>
  );
}
