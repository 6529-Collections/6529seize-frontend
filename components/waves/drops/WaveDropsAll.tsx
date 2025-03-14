import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext, TitleType } from "../../auth/Auth";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import DropsList from "../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsScrollContainer } from "./WaveDropsScrollContainer";
import { useWaveDrops } from "../../../hooks/useWaveDrops";
import { useScrollBehavior } from "../../../hooks/useScrollBehavior";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { useRouter } from "next/router";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useNotificationsContext } from "../../notifications/NotificationsContext";
import { commonApiPostWithoutBodyAndResponse } from "../../../services/api/common-api";

export interface WaveDropsAllProps {
  readonly waveId: string;
  readonly dropId: string | null;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly onQuote: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly initialDrop: number | null;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function WaveDropsAll({
  waveId,
  dropId,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
  onDropContentClick,
}: WaveDropsAllProps) {
  const router = useRouter();
  const { connectedProfile, setTitle } = useContext(AuthContext);

  const { removeWaveDeliveredNotifications } = useNotificationsContext();

  const [serialNo, setSerialNo] = useState<number | null>(initialDrop);
  const [disableAutoPosition, setDisableAutoPosition] = useState(false);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    haveNewDrops,
  } = useWaveDrops({
    waveId,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: true,
    dropId,
  });

  const {
    scrollContainerRef,
    isAtBottom,
    scrollToBottom,
    scrollToTop,
    handleScroll,
  } = useScrollBehavior();

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToSerialNo = useCallback(
    (behavior: ScrollBehavior) => {
      if (serialNo && targetDropRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const targetElement = targetDropRef.current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const scrollTop =
          container.scrollTop +
          (targetRect.top - containerRect.top) -
          containerRect.height / 2 +
          targetRect.height / 2;

        container.scrollTo({
          top: scrollTop,
          behavior: behavior,
        });
        return true;
      }
      return false;
    },
    [serialNo]
  );

  const [newItemsCount, setNewItemsCount] = useState(0);

  useEffect(() => {
    setTitle({
      title: haveNewDrops ? "New Drops Available | 6529 SEIZE" : null,
      type: TitleType.WAVE,
    });

    return () => {
      setTitle({
        title: null,
        type: TitleType.WAVE,
      });
    };
  }, [haveNewDrops]);

  const smallestSerialNo = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (drops.length > 0) {
      setInit(true);
      setNewItemsCount((prevCount) => {
        const newCount = drops.length - prevCount;
        return prevCount !== newCount ? newCount : prevCount;
      });
      const minSerialNo = Math.min(...drops.map((drop) => drop.serial_no));
      smallestSerialNo.current = minSerialNo;
      const lastDrop = drops[drops.length - 1];
      if (lastDrop.id.startsWith("temp-")) {
        setSerialNo(lastDrop.serial_no);
      }
    } else {
      smallestSerialNo.current = null;
    }
  }, [drops]);

  useEffect(() => {
    removeWaveDeliveredNotifications(waveId);
    void commonApiPostWithoutBodyAndResponse({
      endpoint: `notifications/wave/${waveId}/read`,
    }).catch((error) => console.error("Failed to mark feed as read:", error));
  }, [waveId]);

  const fetchAndScrollToDrop = useCallback(async () => {
    if (!serialNo) return;
    let found = false;
    setIsScrolling(true);

    const checkAndFetchNext = async () => {
      if (found || !hasNextPage || isFetching || isFetchingNextPage) {
        setIsScrolling(false);
        return;
      }
      await fetchNextPage();

      if (smallestSerialNo.current && smallestSerialNo.current <= serialNo) {
        found = true;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        scrollToSerialNo("smooth");
        setIsScrolling(false);
        setSerialNo(null);
      } else {
        scrollToTop();
        setTimeout(checkAndFetchNext, 1000);
      }
    };

    checkAndFetchNext();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    scrollToSerialNo,
    serialNo,
    setSerialNo,
    scrollToTop,
  ]);

  useEffect(() => {
    if (init && serialNo) {
      setDisableAutoPosition(true);
      const success = scrollToSerialNo("smooth");
      if (success) {
        setSerialNo(null);
      } else {
        fetchAndScrollToDrop();
      }
      setTimeout(() => setDisableAutoPosition(false), 1000);
    }
  }, [init, serialNo]);

  const handleTopIntersection = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const onQuoteClick = useCallback(
    (drop: ApiDrop) => {
      if (drop.wave.id !== waveId) {
        router.push(
          `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}`
        );
      } else {
        setSerialNo(drop.serial_no);
      }
    },
    [router, waveId, setSerialNo]
  );

  const memoizedDrops = useMemo(() => drops, [drops]);

  const renderContent = () => {
    if (isFetching && !isFetchingNextPage && !drops.length) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      );
    }

    if (drops.length === 0) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10 tw-space-y-6 tw-text-iron-400">
          <div className="tw-relative tw-group">
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-primary-400/20 tw-via-indigo-500/10 tw-to-iron-800/10 tw-rounded-full tw-animate-[spin_4s_linear_infinite] group-hover:tw-from-primary-400/30"></div>
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-iron-800/10 tw-via-indigo-500/10 tw-to-primary-400/20 tw-rounded-full tw-animate-[spin_5s_linear_infinite] group-hover:tw-to-primary-400/30"></div>
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-radial tw-from-primary-300/5 tw-to-transparent tw-animate-pulse"></div>
            <svg
              className="tw-size-10 tw-flex-shrink-0 tw-relative tw-text-white/60"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="currentColor"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-4">
            <span className="tw-tracking-tight tw-text-lg tw-font-semibold tw-bg-gradient-to-br tw-from-iron-200 tw-via-iron-300 tw-to-iron-400 tw-bg-clip-text tw-text-transparent">
              Be the First to Start a Discussion
            </span>
            <p className="tw-text-sm tw-text-iron-500 tw-text-center tw-mb-0 tw-max-w-xs">
              {dropId ? "Share your thoughts and join the discussion." : ""}
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <WaveDropsScrollContainer
          ref={scrollContainerRef}
          onScroll={handleScroll}
          newItemsCount={newItemsCount}
          isFetchingNextPage={isFetchingNextPage}
          onTopIntersection={handleTopIntersection}
          disableAutoPosition={disableAutoPosition}>
          <div className="tw-divide-y-2 tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
            <DropsList
              scrollContainerRef={scrollContainerRef}
              onReplyClick={setSerialNo}
              drops={memoizedDrops}
              showWaveInfo={false}
              isFetchingNextPage={isFetchingNextPage}
              onReply={onReply}
              onQuote={onQuote}
              showReplyAndQuote={true}
              activeDrop={activeDrop}
              serialNo={serialNo}
              targetDropRef={targetDropRef}
              onQuoteClick={onQuoteClick}
              parentContainerRef={scrollContainerRef}
              dropViewDropId={dropId}
              onDropContentClick={onDropContentClick}
            />
          </div>
        </WaveDropsScrollContainer>

        <WaveDropsScrollBottomButton
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
        />
      </>
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-justify-center tw-relative tw-overflow-y-auto tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-border-x tw-border-t tw-border-b-0">
      {renderContent()}
      {isScrolling && (
        <>
          <div className="tw-absolute tw-inset-0 tw-bg-iron-900 tw-bg-opacity-50 tw-z-10" />
          <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-z-20">
            <div className="tw-rounded-full tw-p-4">
              <CircleLoader size={CircleLoaderSize.XXLARGE} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
