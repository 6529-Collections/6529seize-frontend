import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext, TitleType } from "../../../auth/Auth";
import { commonApiFetch } from "../../../../services/api/common-api";
import { Drop } from "../../../../generated/models/Drop";
import { ActiveDropState } from "../WaveDetailedContent";
import { WaveDropsFeed } from "../../../../generated/models/WaveDropsFeed";
import WaveDropThreadTrace from "./WaveDropThreadTrace";
import DropsList from "../../../drops/view/DropsList";
import { useDebounce } from "react-use";
import { getStableDropKey } from "../../../../helpers/waves/drop.helpers";
import { WaveMin } from "../../../../generated/models/WaveMin";
import { DropWithoutWave } from "../../../../generated/models/DropWithoutWave";
import { WaveDropsNewDropsAvailable } from "./WaveDropsNewDropsAvailable";
import { WaveDropsBackButton } from "./WaveDropsBackButton";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import WaveDropsThreadHeader from "./WaveDropsThread";
import { WaveDropsScrollContainer } from "./WaveDropsScrollContainer";

const REQUEST_SIZE = 20;
const POLLING_DELAY = 3000; // 3 seconds delay

interface WaveDropsProps {
  readonly wave: Wave;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onBackToList?: () => void;
}

export interface ExtendedDrop extends Drop {
  readonly stableKey: string;
  readonly stableHash: string;
}

const createExtendedDrop = (
  drop: DropWithoutWave,
  wave: WaveMin,
  prevDrops: ExtendedDrop[]
): ExtendedDrop => {
  const { key, hash } = getStableDropKey({ ...drop, wave }, prevDrops);
  return {
    ...drop,
    wave,
    stableKey: key,
    stableHash: hash,
  };
};

const processWaveDropsFeed = (
  page: WaveDropsFeed,
  prevDrops: ExtendedDrop[]
): ExtendedDrop[] => {
  return page.drops.map((drop) =>
    createExtendedDrop(drop, page.wave, prevDrops)
  );
};

const mapToExtendedDrops = (
  pages: WaveDropsFeed[],
  prevDrops: ExtendedDrop[]
): ExtendedDrop[] => {
  return pages
    .flatMap((page) => processWaveDropsFeed(page, prevDrops))
    .reverse();
};

const incrementKeyCount = (
  keyCount: Map<string, number>,
  key: string
): number => {
  const count = (keyCount.get(key) ?? 0) + 1;
  keyCount.set(key, count);
  return count;
};

const generateFinalKey = (
  keyCount: Map<string, number>,
  initialKey: string
): string => {
  const count = incrementKeyCount(keyCount, initialKey);
  return count > 1 ? `${initialKey}-${count}` : initialKey;
};

const createUpdatedDrop = (
  drop: ExtendedDrop,
  finalKey: string,
  existingDrop: ExtendedDrop | undefined
): ExtendedDrop => {
  if (existingDrop) {
    return {
      ...drop,
      stableKey: finalKey,
      stableHash: existingDrop.stableHash,
    };
  }
  return { ...drop, stableKey: finalKey };
};

const generateUniqueKeys = (
  drops: ExtendedDrop[],
  prevDrops: ExtendedDrop[]
): ExtendedDrop[] => {
  const keyCount = new Map<string, number>();

  return drops.map((drop) => {
    const existingDrop = prevDrops.find(
      (d) => d.stableHash === drop.stableHash
    );
    const finalKey = generateFinalKey(keyCount, drop.stableKey);
    return createUpdatedDrop(drop, finalKey, existingDrop);
  });
};

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  rootDropId,
  onBackToList,
}: WaveDropsProps) {
  const { connectedProfile, setTitle } = useContext(AuthContext);
  const [delayedPollingResult, setDelayedPollingResult] = useState<
    WaveDropsFeed | undefined
  >(undefined);

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
    enabled: !!connectedProfile?.profile?.handle,
  });

  const [drops, setDrops] = useState<ExtendedDrop[]>([]);
  useEffect(() => {
    setDrops((prev) => {
      const newDrops = data?.pages ? mapToExtendedDrops(data.pages, prev) : [];
      return generateUniqueKeys(newDrops, prev);
    });
  }, [data]);

  const [haveNewDrops, setHaveNewDrops] = useState(false);

  const [canPoll, setCanPoll] = useState(false);
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

  const onIntersection = useCallback(
    (state: boolean) => {
      if (state && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]
  );

  const onRefresh = () => {
    refetch();
  };

  useEffect(() => {
    // Set the title when the component mounts or when haveNewDrops changes
    setTitle({
      title: haveNewDrops ? "New Drops Available | 6529 SEIZE" : null,
      type: TitleType.WAVE,
    });

    // Cleanup function to reset the title when the component unmounts
    return () => {
      setTitle({
        title: null,
        type: TitleType.WAVE,
      });
    };
  }, [haveNewDrops]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop } = container;
      const newIsAtBottom = scrollTop === 0;
      setIsAtBottom(newIsAtBottom);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [drops, isAtBottom, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
    setTimeout(() => handleScroll(), 100);
  }, [scrollToBottom, handleScroll]);

  return (
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-16rem)] lg:tw-h-[calc(100vh-13rem)] tw-relative">
      <WaveDropsNewDropsAvailable
        haveNewDrops={haveNewDrops}
        onRefresh={onRefresh}
      />
      <WaveDropsThreadHeader
        rootDropId={rootDropId}
        wave={wave}
        onBackToList={onBackToList}
      />
      <WaveDropsScrollContainer
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <DropsList
          drops={drops}
          showWaveInfo={false}
          onIntersection={onIntersection}
          onReply={onReply}
          onQuote={onQuote}
          showReplyAndQuote={true}
          activeDrop={activeDrop}
          rootDropId={rootDropId}
        />
      </WaveDropsScrollContainer>

      <WaveDropsScrollBottomButton
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}
