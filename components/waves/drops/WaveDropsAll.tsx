import { useCallback, useEffect, useRef, useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import DropsList from "../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsReverseContainer } from "./WaveDropsReverseContainer";
import { useScrollBehavior } from "../../../hooks/useScrollBehavior";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { useRouter } from "next/router";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropSize, ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WaveDropsEmptyPlaceholder from "./WaveDropsEmptyPlaceholder";
import WaveDropsScrollingOverlay from "./WaveDropsScrollingOverlay";
import { useNotificationsContext } from "../../notifications/NotificationsContext";
import { commonApiPostWithoutBodyAndResponse } from "../../../services/api/common-api";
import { useVirtualizedWaveDrops } from "../../../hooks/useVirtualizedWaveDrops";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { useWaveIsTyping } from "../../../hooks/useWaveIsTyping";
import { useAuth } from "../../auth/Auth";

interface WaveDropsAllProps {
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
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const { connectedProfile } = useAuth();

  const { waveMessages, fetchNextPage } = useVirtualizedWaveDrops(
    waveId,
    dropId
  );

  const [serialNo, setSerialNo] = useState<number | null>(initialDrop);

  const { scrollContainerRef, scrollToVisualTop, scrollToVisualBottom } =
    useScrollBehavior();

  const [isAtBottom, setIsAtBottom] = useState(true);

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const [userHasManuallyScrolled, setUserHasManuallyScrolled] = useState(false);

  const scrollToSerialNo = useCallback(
    (behavior: ScrollBehavior) => {
      // Check if the target ref exists and is associated with the targetSerial
      if (targetDropRef.current && scrollContainerRef.current) {
        targetDropRef.current.scrollIntoView({
          behavior: behavior,
          block: "center",
        });
        return true;
      }
      return false;
    },
    [] // No state dependencies needed here
  );

  const smoothScrollWithRetries = useCallback(
    () => {
      // Attempt initial smooth scroll
      const initialSuccess = scrollToSerialNo("smooth");
      // If the element was found and initial scroll started...
      if (initialSuccess) {
        // Schedule follow-up scrolls with 'auto' behavior to quickly correct position after layout shifts
        setTimeout(() => {
          scrollToSerialNo("auto");
          // Second follow-up scroll
          setTimeout(() => {
            scrollToSerialNo("auto");
          }, 300); // Delay after the first follow-up
        }, 300); // Initial delay after smooth scroll starts
      }
      return initialSuccess; // Return success of the first attempt
    },
    [scrollToSerialNo] // Depends on the stable scrollToSerialNo
  );

  const [revealingDrop, setRevealingDrop] = useState<boolean>(false);

  useEffect(() => {
    if (!serialNo || revealingDrop) return;
    setRevealingDrop(true);
    console.log(waveMessages?.allDropsCount);
  }, [serialNo, waveMessages?.allDropsCount, revealingDrop]);

  const revealDropAndScrollToIt = useCallback(
    async (targetSerialNo: number) => {
      if (isScrolling) return;
      setIsScrolling(true);
      await fetchNextPage(
        {
          waveId,
          type: DropSize.LIGHT,
          targetSerialNo: targetSerialNo,
        },
        dropId
      );
      console.log("fetching next page done");
      setTimeout(() => {
        setSerialNo(targetSerialNo);
      }, 100);
    },
    [setIsScrolling, fetchNextPage, waveId, dropId]
  );

  // Ref to hold the latest waveMessages state to avoid stale closures
  // const latestWaveMessagesRef = useRef(waveMessages);

  // const smallestSerialNo = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null
  );

  // // Effect to update the ref whenever waveMessages changes
  // useEffect(() => {
  //   latestWaveMessagesRef.current = waveMessages;
  //   // Recalculate smallestSerialNo based on the potentially updated data
  //   if (waveMessages && waveMessages.drops.length > 0) {
  //     const minSerialNo = Math.min(
  //       ...waveMessages.drops.map((drop) => drop.serial_no)
  //     );
  //     smallestSerialNo.current = minSerialNo;
  //   } else {
  //     smallestSerialNo.current = null;
  //   }
  // }, [waveMessages]);

  // Effect for initial load and handling own temporary drops
  // useEffect(() => {
  //   const currentMessages = latestWaveMessagesRef.current;
  //   if (currentMessages && currentMessages.drops.length > 0) {
  //     if (!init) setInit(true);

  //     const lastDrop = currentMessages.drops[0];
  //     if (lastDrop.id.startsWith("temp-")) {
  //       if (isAtBottom && !userHasManuallyScrolled) {
  //         setTimeout(() => {
  //           scrollToVisualBottom();
  //         }, 100);
  //       } else if (!userHasManuallyScrolled) {
  //         setSerialNo(lastDrop.serial_no);
  //       }
  //     }
  //   }
  // }, [
  //   waveMessages,
  //   isAtBottom,
  //   userHasManuallyScrolled,
  //   scrollToVisualBottom,
  //   init,
  // ]); // Keep dependencies, logic uses ref

  useEffect(() => {
    void removeWaveDeliveredNotifications(waveId);
    void commonApiPostWithoutBodyAndResponse({
      endpoint: `notifications/wave/${waveId}/read`,
    }).catch((error) => console.error("Failed to mark feed as read:", error));
  }, [waveId]);

  // const revealDropAndScrollToIt = useCallback(async () => {
  //   console.log(smallestSerialNo.current);

  // }, []);

  // const fetchAndScrollToDrop = useCallback(async () => {
  //   if (!serialNo) return;
  //   setIsScrolling(true); // Set scrolling true for the entire process

  //   // TODO: do it separate function what checks if the drop is found, if not, then fetch more
  //   await fetchNextPage(
  //     {
  //       waveId,
  //       type: DropSize.LIGHT,
  //       targetSerialNo: serialNo,
  //     },
  //     dropId
  //   );
  //   revealDropAndScrollToIt();
  // }, [waveId, fetchNextPage, serialNo, setIsScrolling, revealDropAndScrollToIt]);

  // // Effect to trigger the fetch loop when serialNo is set and we are initialized
  // useEffect(() => {
  //   if (init && serialNo) {
  //     const currentSmallestSerial = smallestSerialNo.current;

  //     // Check if already loaded before attempting scroll or fetch
  //     if (currentSmallestSerial && currentSmallestSerial <= serialNo) {
  //       const success = smoothScrollWithRetries();
  //       if (success) {
  //         setSerialNo(null);
  //       } else {
  //         fetchAndScrollToDrop();
  //       }
  //     } else {
  //       fetchAndScrollToDrop();
  //     }
  //   }
  //   return () => {
  //     // Cleanup logic if needed
  //   };
  // }, [init, serialNo]);

  const handleTopIntersection = useCallback(async () => {
    if (
      waveMessages?.hasNextPage &&
      !waveMessages?.isLoading &&
      !waveMessages?.isLoadingNextPage &&
      !isScrolling
    ) {
      await fetchNextPage(
        {
          waveId,
          type: DropSize.FULL,
        },
        dropId
      );
    }
  }, [
    waveMessages?.hasNextPage,
    waveMessages?.isLoading,
    waveMessages?.isLoadingNextPage,
    fetchNextPage,
    isScrolling,
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
            onReplyClick={() => revealDropAndScrollToIt(101818)}
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

        <div
          className={`tw-absolute tw-bottom-0 tw-left-0 tw-z-10 tw-inset-x-0 tw-mr-2 tw-px-4 tw-py-1 tw-flex tw-items-center tw-gap-x-2 tw-bg-iron-950 tw-transition-opacity tw-duration-300 tw-ease-in-out ${
            typingMessage
              ? "tw-opacity-100 tw-visible"
              : "tw-opacity-0 tw-invisible tw-hidden"
          }`}
        >
          <div className="tw-flex tw-items-center tw-gap-x-0.5">
            <FontAwesomeIcon
              icon={faCircle}
              className="tw-text-iron-300 tw-h-1 tw-w-1 tw-animate-pulse"
            />
            <FontAwesomeIcon
              icon={faCircle}
              className="tw-text-iron-400 tw-h-1 tw-w-1 tw-animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <FontAwesomeIcon
              icon={faCircle}
              className="tw-text-iron-500 tw-h-1 tw-w-1 tw-animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="tw-text-xs tw-text-iron-400">{typingMessage}</span>
        </div>
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
