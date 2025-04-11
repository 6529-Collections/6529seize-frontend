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
import { Time } from "../../../helpers/time";

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

  const { waveMessages, fetchNextPageForWave } =
    useVirtualizedWaveDrops(waveId);

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

  // Ref to hold the latest waveMessages state to avoid stale closures
  const latestWaveMessagesRef = useRef(waveMessages);

  const smallestSerialNo = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  // Effect to update the ref whenever waveMessages changes
  useEffect(() => {
    latestWaveMessagesRef.current = waveMessages;
    // Recalculate smallestSerialNo based on the potentially updated data
    if (waveMessages && waveMessages.drops.length > 0) {
      const minSerialNo = Math.min(
        ...waveMessages.drops.map((drop) => drop.serial_no)
      );
      smallestSerialNo.current = minSerialNo;
    } else {
      smallestSerialNo.current = null;
    }
  }, [waveMessages]);

  // Effect for initial load and handling own temporary drops
  useEffect(() => {
    const currentMessages = latestWaveMessagesRef.current;
    if (currentMessages && currentMessages.drops.length > 0) {
      if (!init) setInit(true);

      const lastDrop = currentMessages.drops[0];
      if (lastDrop.id.startsWith("temp-")) {
        if (isAtBottom && !userHasManuallyScrolled) {
          setTimeout(() => {
            scrollToVisualBottom();
          }, 100);
        } else if (!userHasManuallyScrolled) {
          setSerialNo(lastDrop.serial_no);
        }
      }
    }
  }, [waveMessages, isAtBottom, userHasManuallyScrolled, scrollToVisualBottom, init]); // Keep dependencies, logic uses ref

  useEffect(() => {
    void removeWaveDeliveredNotifications(waveId);
    void commonApiPostWithoutBodyAndResponse({
      endpoint: `notifications/wave/${waveId}/read`,
    }).catch((error) => console.error("Failed to mark feed as read:", error));
  }, [waveId]);
  

  const fetchAndScrollToDrop = useCallback(async () => {
    if (!serialNo) return;
    
    console.log(`[WaveDropsAll] fetchAndScrollToDrop (waveId: ${waveId}): Starting loop. Target serialNo: ${serialNo}`);
    setIsScrolling(true); // Set scrolling true for the entire process
    
    let found = false; // Keep track locally if found

    const checkAndFetchNext = async () => {
      // Always get the latest state from the ref
      const currentMessages = latestWaveMessagesRef.current;
      const currentSmallestSerial = smallestSerialNo.current;

      // Check if target is now loaded
      if (currentSmallestSerial && currentSmallestSerial <= serialNo) {
        found = true;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Short delay for render
        scrollToSerialNo("smooth");
        setSerialNo(null);
        setIsScrolling(false); // **** Stop scrolling only AFTER successful scroll ****
        return; // Exit the loop
      }

      // Check if we should stop fetching (no more pages or already fetching)
      if (
        !currentMessages?.hasNextPage ||
        currentMessages?.isLoading ||
        currentMessages?.isLoadingNextPage
      ) {
         if (!currentMessages?.hasNextPage) {
             console.log(`[WaveDropsAll] checkAndFetchNext (waveId: ${waveId}): Target ${serialNo} NOT FOUND and no more pages. Stopping.`);
             setSerialNo(null); // Clear the target
         } else {
             console.log(`[WaveDropsAll] checkAndFetchNext (waveId: ${waveId}): Already loading. Will retry check shortly.`);
             // Don't set isScrolling false here, just wait and retry check
             setTimeout(checkAndFetchNext, 1000); // Retry check later
             return;
         }
        setIsScrolling(false); // **** Stop scrolling if no more pages or error ****
        return; // Exit the loop
      }

      // --- If target not found and we can fetch more --- 
      console.log(`[WaveDropsAll] checkAndFetchNext (waveId: ${waveId}): Target ${serialNo} NOT found (smallest loaded: ${currentSmallestSerial}). Fetching next page.`);
      
      await fetchNextPageForWave(waveId);

      // ** Crucial:** After await, state *might* have updated. 
      // The ref is updated by useEffect, so the *next* call to checkAndFetchNext will see it.
      
      // Scroll to top after fetch completes to show newly loaded older messages
      console.log(`[WaveDropsAll] checkAndFetchNext (waveId: ${waveId}): Fetch complete. Scrolling to visual top.`);
      scrollToVisualTop(); // <--- SCROLL TO TOP HERE
      
      // Schedule the next check without altering isScrolling state
      setTimeout(checkAndFetchNext, 1000); 
    };

    // Start the first check
    checkAndFetchNext();

  }, [
    waveId,
    fetchNextPageForWave,
    scrollToSerialNo,
    serialNo,
    setSerialNo,
    setIsScrolling,
    scrollToVisualTop, // <-- Add scrollToVisualTop dependency
    init, 
  ]);

  // Effect to trigger the fetch loop when serialNo is set and we are initialized
  useEffect(() => {
    if (init && serialNo) {
      const currentMessages = latestWaveMessagesRef.current;
      const currentSmallestSerial = smallestSerialNo.current;
      
      // Check if already loaded before attempting scroll or fetch
      if (currentSmallestSerial && currentSmallestSerial <= serialNo) {
         console.log(`[WaveDropsAll] Initial effect: Target serialNo ${serialNo} already loaded (smallest: ${currentSmallestSerial}). Attempting scroll.`);
         const success = scrollToSerialNo("smooth");
         if (success) {
           setSerialNo(null);
         } else {
            console.log(`[WaveDropsAll] Initial effect: Scroll failed for already loaded serialNo ${serialNo}. Triggering fetch loop as fallback.`);
            fetchAndScrollToDrop(); 
         }
      } else {
        console.log(`[WaveDropsAll] Initial effect: Target serialNo ${serialNo} not loaded (smallest: ${currentSmallestSerial}). Starting fetch loop.`);
        fetchAndScrollToDrop();
      }
    }
    return () => {
      // Cleanup logic if needed
    };
  }, [init, serialNo, fetchAndScrollToDrop, scrollToSerialNo, setSerialNo]); 

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
