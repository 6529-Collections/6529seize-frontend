import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext, TitleType } from "../../auth/Auth";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import DropsList from "../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsNonReverseContainer } from "./WaveDropsNonReverseContainer";
import { useWaveDrops } from "../../../hooks/useWaveDrops";
import { useScrollBehavior } from "../../../hooks/useScrollBehavior";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { useRouter } from "next/router";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WaveDropsEmptyPlaceholder from "./WaveDropsEmptyPlaceholder";
import WaveDropsScrollingOverlay from "./WaveDropsScrollingOverlay";
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
    refetch,
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
  const [userHasManuallyScrolled, setUserHasManuallyScrolled] = useState(false);

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

  // Auto-scroll to bottom when new drops are available and user is already at bottom
  const [isHandlingNewDrops, setIsHandlingNewDrops] = useState(false);

  useEffect(() => {
    if (
      haveNewDrops &&
      isAtBottom &&
      !isHandlingNewDrops &&
      !isFetching &&
      !userHasManuallyScrolled
    ) {
      setIsHandlingNewDrops(true);
      refetch()
        .then(() => {
          setTimeout(() => {
            scrollToBottom();
            setIsHandlingNewDrops(false);
          }, 100); // Small delay to ensure DOM is updated
        })
        .catch(() => {
          // In case of error, still reset the handling state
          setIsHandlingNewDrops(false);
        });
    }
  }, [
    haveNewDrops,
    isAtBottom,
    isHandlingNewDrops,
    isFetching,
    refetch,
    scrollToBottom,
    userHasManuallyScrolled,
  ]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (drops.length > 0 && scrollContainerRef.current && !initialDrop) {
      // Need setTimeout to ensure all content is rendered before scrolling
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [drops.length > 0]);

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

      // Check if the last drop is a temp drop (your own post)
      const lastDrop = drops[drops.length - 1];
      if (lastDrop.id.startsWith("temp-")) {
        // For user's own new drop, scroll to bottom - but only if they haven't manually scrolled away
        if (isAtBottom && !userHasManuallyScrolled) {
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else if (!userHasManuallyScrolled) {
          // If not at bottom, use the serialNo approach to scroll to the specific drop
          // Again, only if they haven't manually scrolled away
          setSerialNo(lastDrop.serial_no);
        }
        // If they've manually scrolled, respect their intention and don't auto-scroll
      }
    } else {
      smallestSerialNo.current = null;
    }
  }, [drops, isAtBottom, scrollToBottom]);

  useEffect(() => {
    void removeWaveDeliveredNotifications(waveId);
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
    if (
      hasNextPage &&
      !isFetching &&
      !isFetchingNextPage &&
      !isHandlingNewDrops
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    isHandlingNewDrops,
  ]);

  const onQuoteClick = useCallback(
    (drop: ApiDrop) => {
      if (drop.wave.id !== waveId) {
        router.push(
          `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}`
        );
      } else {
        setSerialNo(drop.serial_no);
        setUserHasManuallyScrolled(false); // Reset when navigating to specific content
      }
    },
    [router, waveId, setSerialNo]
  );

  const renderContent = () => {
    if (isFetching && !isFetchingNextPage && !drops.length) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      );
    }

    if (drops.length === 0) {
      return <WaveDropsEmptyPlaceholder dropId={dropId} />;
    }

    return (
      <>
        <WaveDropsNonReverseContainer
          ref={scrollContainerRef}
          onScroll={handleScroll}
          newItemsCount={newItemsCount}
          isFetchingNextPage={isFetchingNextPage}
          onTopIntersection={handleTopIntersection}
          disableAutoPosition={disableAutoPosition}
        >
          <div className="tw-divide-y-2 tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
            <DropsList
              scrollContainerRef={scrollContainerRef}
              onReplyClick={setSerialNo}
              drops={drops}
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
        </WaveDropsNonReverseContainer>

        <WaveDropsScrollBottomButton
          isAtBottom={isAtBottom}
          scrollToBottom={() => {
            scrollToBottom();
            setUserHasManuallyScrolled(false); // Reset manual scroll flag when user clicks to bottom
          }}
        />
      </>
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-justify-center tw-relative tw-overflow-y-auto tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-border-x tw-border-t tw-border-b-0">
      {renderContent()}
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
}
