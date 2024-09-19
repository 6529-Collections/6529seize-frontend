import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AuthContext, TitleType } from "../../../auth/Auth";
import { commonApiFetch } from "../../../../services/api/common-api";
import { Drop } from "../../../../generated/models/Drop";
import { ActiveDropState } from "../WaveDetailedContent";
import { WaveDropsFeed } from "../../../../generated/models/WaveDropsFeed";
import WaveDropThreadTrace from "./WaveDropThreadTrace";
import DropsList from "../../../drops/view/DropsList";
import { useDebounce } from "react-use";

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
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // const debouncedMaintainScrollPosition = useCallback(() => {
  //   if (resizeTimeoutRef.current) {
  //     clearTimeout(resizeTimeoutRef.current);
  //   }
  //   resizeTimeoutRef.current = setTimeout(() => {
  //     maintainScrollPosition();
  //   }, 50);
  // }, [maintainScrollPosition]);

  // useEffect(() => {
  //   const container = containerRef.current;
  //   if (container) {
  //     const resizeObserver = new ResizeObserver(
  //       debouncedMaintainScrollPosition
  //     );
  //     resizeObserver.observe(container);

  //     const mutationObserver = new MutationObserver(
  //       debouncedMaintainScrollPosition
  //     );
  //     mutationObserver.observe(container, {
  //       childList: true,
  //       subtree: true,
  //       attributes: true,
  //       characterData: true,
  //     });

  //     return () => {
  //       resizeObserver.disconnect();
  //       mutationObserver.disconnect();
  //       if (resizeTimeoutRef.current) {
  //         clearTimeout(resizeTimeoutRef.current);
  //       }
  //     };
  //   }
  // }, [debouncedMaintainScrollPosition]);

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
      className="tw-h-[calc(100vh-245px)] tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0"
    >
      <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950 tw-border-b tw-border-b-iron-800 tw-border-solid tw-border-x-0 tw-border-t-0">
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
    </div>
  );
}
