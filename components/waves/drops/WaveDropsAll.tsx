import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import DropsList from "../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsReverseContainer } from "./WaveDropsReverseContainer";
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
import {
  useMyStream,
  useMyStreamWaveMessages,
} from "../../../contexts/wave/MyStreamContext";
import useWaveMessagesStore from "../../../contexts/wave/hooks/useWaveMessagesStore";
import { useVirtualizedWaveDrops } from "../../../hooks/useVirtualizedWaveDrops";

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
  const { connectedProfile } = useContext(AuthContext);

  const { removeWaveDeliveredNotifications } = useNotificationsContext();

  const { waveMessages, fetchNextPageForWave } = useVirtualizedWaveDrops(waveId);

  const [serialNo, setSerialNo] = useState<number | null>(initialDrop);
  // const {
  //   drops,
  //   fetchNextPage,
  //   hasNextPage,
  //   isFetching,
  //   isFetchingNextPage,
  //   haveNewDrops,
  // } = useWaveDrops({
  //   waveId,
  //   connectedProfileHandle: connectedProfile?.profile?.handle,
  //   reverse: false,
  //   dropId,
  // });

  const haveNewDrops = false;

  const { scrollContainerRef, scrollToVisualTop, scrollToVisualBottom } =
    useScrollBehavior();

  const [isAtBottom, setIsAtBottom] = useState(true);

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

  const smallestSerialNo = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (waveMessages && waveMessages.drops.length > 0) {
      setInit(true);

      const minSerialNo = Math.min(
        ...waveMessages.drops.map((drop) => drop.serial_no)
      );
      smallestSerialNo.current = minSerialNo;

      // Check if the last drop is a temp drop (your own post)
      const lastDrop = waveMessages.drops[0];
      if (lastDrop.id.startsWith("temp-")) {
        // For user's own new drop, scroll to bottom - but only if they haven't manually scrolled away
        if (isAtBottom && !userHasManuallyScrolled) {
          setTimeout(() => {
            scrollToVisualBottom();
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
  }, [waveMessages?.drops, isAtBottom, scrollToVisualBottom]);

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
      if (
        found ||
        !waveMessages?.hasNextPage ||
        waveMessages?.isLoading ||
        waveMessages?.isLoadingNextPage
      ) {
        setIsScrolling(false);
        return;
      }
      await fetchNextPageForWave(waveId);

      if (smallestSerialNo.current && smallestSerialNo.current <= serialNo) {
        found = true;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        scrollToSerialNo("smooth");
        setIsScrolling(false);
        setSerialNo(null);
      } else {
        scrollToVisualTop();
        setTimeout(checkAndFetchNext, 1000);
      }
    };

    checkAndFetchNext();
  }, [
    fetchNextPageForWave,
    waveMessages?.hasNextPage,
    waveMessages?.isLoading,
    waveMessages?.isLoadingNextPage,
    scrollToSerialNo,
    serialNo,
    setSerialNo,
    scrollToVisualTop,
  ]);

  useEffect(() => {
    if (init && serialNo) {
      const success = scrollToSerialNo("smooth");
      if (success) {
        setSerialNo(null);
      } else {
        fetchAndScrollToDrop();
      }
    }
  }, [init, serialNo]);

  const handleTopIntersection = useCallback(() => {
    if (
      waveMessages?.hasNextPage &&
      !waveMessages?.isLoading &&
      !waveMessages?.isLoadingNextPage
    ) {
      fetchNextPageForWave(waveId);
    }
  }, [
    waveMessages?.hasNextPage,
    waveMessages?.isLoading,
    waveMessages?.isLoadingNextPage,
    fetchNextPageForWave,
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
    [router, waveId] // removed setSerialNo from deps as it's a setState function that never changes
  );

  const renderContent = () => {
    if (
      waveMessages?.isLoading &&
      !waveMessages?.isLoadingNextPage &&
      !waveMessages?.drops.length
    ) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      );
    }

    if (waveMessages?.drops.length === 0) {
      return <WaveDropsEmptyPlaceholder dropId={dropId} />;
    }

    return (
      <>
        <WaveDropsReverseContainer
          ref={scrollContainerRef}
          isFetchingNextPage={!!waveMessages?.isLoadingNextPage}
          hasNextPage={!!waveMessages?.hasNextPage}
          onTopIntersection={handleTopIntersection}
          onUserScroll={(direction, isAtBottom) => {
            setIsAtBottom(isAtBottom);
            if (direction === "up") {
              setUserHasManuallyScrolled(true);
            }
          }}
        >
          <DropsList
            scrollContainerRef={scrollContainerRef}
            onReplyClick={setSerialNo}
            drops={waveMessages?.drops ?? []}
            showWaveInfo={false}
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
            key="drops-list" // Add a stable key to help React with reconciliation
          />
        </WaveDropsReverseContainer>
        <WaveDropsScrollBottomButton
          isAtBottom={isAtBottom}
          scrollToBottom={() => {
            scrollToVisualBottom();
            setUserHasManuallyScrolled(false); // Reset manual scroll flag when user clicks to bottom
          }}
        />
      </>
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-justify-end tw-relative tw-overflow-y-auto tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-border-x tw-border-t tw-border-b-0">
      {renderContent()}
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
}
