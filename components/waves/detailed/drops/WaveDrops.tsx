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
import { AnimatePresence, motion } from "framer-motion";

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

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  rootDropId,
  onBackToList,
}: WaveDropsProps) {
  const { connectedProfile, setTitle } = useContext(AuthContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const [delayedPollingResult, setDelayedPollingResult] = useState<
    WaveDropsFeed | undefined
  >(undefined);

  const scrollInfo = useRef({ scrollTop: 0, scrollHeight: 0 });

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

  const [drops, setDrops] = useState<Drop[]>([]);
  useEffect(() => {
    setDrops(
      data?.pages
        .flatMap((page) =>
          page.drops.map((drop) => ({
            ...drop,
            wave: page.wave,
          }))
        )
        .reverse() ?? []
    );
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

  const maintainScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const { scrollTop, scrollHeight } = scrollInfo.current;
      const newScrollHeight = container.scrollHeight;
      const deltaHeight = newScrollHeight - scrollHeight;

      if (deltaHeight !== 0) {
        container.scrollTop = scrollTop + deltaHeight;
      }
    }
  }, []);

  const [loadedMediaCount, setLoadedMediaCount] = useState(0);

  const checkMediaLoading = useCallback(() => {
    if (containerRef.current) {
      const mediaElements = containerRef.current.querySelectorAll("img, video");

      setLoadedMediaCount(0);
      Array.from(mediaElements).map((element) => {
        if (
          (element as HTMLImageElement).complete ||
          (element instanceof HTMLVideoElement && element.readyState >= 3)
        ) {
          setTimeout(() => {
            setLoadedMediaCount((prev) => prev + 1);
          }, 500);
          return Promise.resolve();
        } else {
          return new Promise<void>((resolve) => {
            const handleLoad = () => {
              setTimeout(() => {
                setLoadedMediaCount((prev) => prev + 1);
                resolve();
              }, 500);
            };
            element.addEventListener("load", handleLoad, { once: true });
            element.addEventListener("error", handleLoad, { once: true });
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    checkMediaLoading();
  }, [drops, checkMediaLoading]);

  useEffect(() => {
    maintainScrollPosition();
  }, [loadedMediaCount, maintainScrollPosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleScroll = () => {
        scrollInfo.current = {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
        };
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (isInitialLoadRef.current && drops.length > 0) {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      isInitialLoadRef.current = false;
    } else {
      maintainScrollPosition();
    }
  }, [drops, maintainScrollPosition]);

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

  return (
    <div
      ref={containerRef}
      className="tw-h-[calc(100vh-14rem)] lg:tw-h-[calc(100vh-13rem)] tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transition-all tw-duration-300"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={rootDropId ?? 'main'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950">
            {rootDropId && onBackToList && (
              <div className="tw-px-4 tw-py-2">
                <button
                  onClick={onBackToList}
                  type="button"
                  className="tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
                >
                  <svg
                    className="tw-flex-shrink-0 tw-w-5 tw-h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 12H4M4 12L10 18M4 12L10 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <span>Back</span>
                </button>
              </div>
            )}
            {rootDropId && (
              <WaveDropThreadTrace rootDropId={rootDropId} wave={wave} />
            )}
          </div>
          <div>
            {haveNewDrops && (
              <div className="tw-sticky tw-top-0 tw-left-0 tw-right-0 tw-z-50 tw-flex tw-justify-center">
                <button
                  onClick={onRefresh}
                  type="button"
                  className="tw-mt-2 tw-border-none tw-bg-primary-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-md tw-cursor-pointer tw-transition-all hover:tw-bg-primary-600 tw-text-xs tw-font-medium"
                >
                  New drops available
                </button>
              </div>
            )}
            <div className="tw-overflow-hidden">
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
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
