"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
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

// Add this utility function if not already present in a shared util file
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const { waveMessages, fetchNextPage, waitAndRevealDrop } =
    useVirtualizedWaveDrops(waveId, dropId);

  const [serialNo, setSerialNo] = useState<number | null>(initialDrop);

  const { scrollContainerRef, scrollToVisualBottom } = useScrollBehavior();

  const [isAtBottom, setIsAtBottom] = useState(false);

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const [userHasManuallyScrolled, setUserHasManuallyScrolled] = useState(false);
  const [containerVisible, setContainerVisible] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [isScrollingToReply, setIsScrollingToReply] = useState(false);
  

  const scrollToSerialNo = useCallback(
    (behavior: ScrollBehavior) => {
      // Check if the target ref exists and is associated with the targetSerial
      if (targetDropRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const targetElement = targetDropRef.current;
        
        // Set flag to prevent bottom maintenance interference
        setIsScrollingToReply(true);
        // Reset manual scroll flag when programmatically scrolling to reply
        setUserHasManuallyScrolled(false);
        
        // Get the target element's position relative to the container
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate the scroll position to center the element
        const targetTop = targetElement.offsetTop;
        const targetHeight = targetElement.offsetHeight;
        const containerHeight = container.clientHeight;
        
        // Center the element in the viewport
        const scrollTo = targetTop - (containerHeight / 2) + (targetHeight / 2);
        
        if (behavior === 'smooth') {
          container.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
          });
        } else {
          container.scrollTop = scrollTo;
        }

        // Check after delay if element is centered
        setTimeout(() => {
          const rect = targetDropRef.current?.getBoundingClientRect();
          const containerRect = scrollContainerRef.current?.getBoundingClientRect();
          
          if (rect && containerRect) {
            const elementCenter = rect.top + rect.height / 2;
            const containerCenter = containerRect.top + containerRect.height / 2;
            const diff = Math.abs(elementCenter - containerCenter);
            
            // If not reasonably centered, try again
            if (diff > 100 && targetDropRef.current && scrollContainerRef.current) {
              const targetTop = targetDropRef.current.offsetTop;
              const targetHeight = targetDropRef.current.offsetHeight;
              const containerHeight = scrollContainerRef.current.clientHeight;
              const scrollTo = targetTop - (containerHeight / 2) + (targetHeight / 2);
              
              scrollContainerRef.current.scrollTo({
                top: scrollTo,
                behavior: behavior
              });
            }
          }
        }, behavior === 'smooth' ? 600 : 150);
        
        // Reset scrolling flag after scroll completes
        setTimeout(() => {
          setIsScrollingToReply(false);
        }, behavior === 'smooth' ? 700 : 200);
        
        return true;
      }
      return false;
    },
    [setUserHasManuallyScrolled]
  );

  const smoothScrollWithRetries = useCallback(
    async (
      maxWaitTimeMs: number = 3000,
      pollIntervalMs: number = 100
    ): Promise<boolean> => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitTimeMs) {
        if (targetDropRef.current) {
          // targetDropRef.current is available, attempt to scroll
          return scrollToSerialNo("smooth");
        }
        await delay(pollIntervalMs);
      }
      // Timeout reached, targetDropRef.current was not found
      console.warn(
        `smoothScrollWithRetries: Timed out after ${maxWaitTimeMs}ms waiting for targetDropRef to be set.`
      );
      return false; // Return false if the ref was not found in time
    },
    [scrollToSerialNo] // scrollToSerialNo is stable
  );

  // Ref to hold the latest waveMessages state to avoid stale closures
  const latestWaveMessagesRef = useRef(waveMessages);

  const smallestSerialNo = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null
  );

  // Memoize reversed drops array to avoid creating new array on every render
  const reversedDrops = useMemo(() => 
    [...(waveMessages?.drops ?? [])].reverse(), 
    [waveMessages?.drops]
  );

  // Precise bottom positioning function
  const maintainBottomPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const targetScrollTop = container.scrollHeight - container.clientHeight;
    
    // Direct assignment - no scroll API calls
    container.scrollTop = targetScrollTop;
  }, []);

  // On mount, jump to bottom before paint and set bottom state
  useLayoutEffect(() => {
    if (scrollContainerRef.current && init && containerVisible) {
      maintainBottomPosition();
      // Set isAtBottom to true immediately after scrolling to bottom
      setIsAtBottom(true);
    }
  }, [init, containerVisible, maintainBottomPosition]);

  // Auto-scroll to bottom when new messages arrive and user is at bottom
  // Lock scroll position when user is not at bottom
  useLayoutEffect(() => {
    if (!waveMessages?.drops.length || !init || !containerVisible || !scrollContainerRef.current) return;
    
    // Skip bottom maintenance when scrolling to reply to prevent interference
    if (isScrollingToReply) return;
    
    const container = scrollContainerRef.current;
    
    if (isAtBottom && !userHasManuallyScrolled) {
      // User is at bottom, maintain bottom position with precise calculation
      maintainBottomPosition();
    } else if (!isAtBottom) {
      // User is not at bottom, lock their current scroll position
      const wasScrollTop = container.scrollTop;
      const wasScrollHeight = container.scrollHeight;
      const newScrollHeight = container.scrollHeight;
      const heightDiff = newScrollHeight - wasScrollHeight;
      // Direct assignment for position lock
      container.scrollTop = wasScrollTop + heightDiff;
    }
  }, [waveMessages?.drops.length, isAtBottom, userHasManuallyScrolled, init, containerVisible, maintainBottomPosition, isScrollingToReply]);

  // Set container visible immediately for empty state
  useEffect(() => {
    if (waveMessages?.drops.length === 0 && !containerVisible) {
      setContainerVisible(true);
    }
  }, [waveMessages?.drops.length, containerVisible]);

  // // Effect to update the ref whenever waveMessages changes
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

  // Effect for initial load - simplified to only use bottom anchor
  useEffect(() => {
    const currentMessages = latestWaveMessagesRef.current;
    if (currentMessages && currentMessages.drops.length > 0 && !init) {
      setInit(true);
      // Show container immediately, bottom anchor will handle scrolling
      requestAnimationFrame(() => {
        setContainerVisible(true);
      });
    }
  }, [waveMessages, init]); // Removed scrollToVisualBottom dependency

  // Reset scroll state when switching waves (don't reset isAtBottom - let initialization handle it)
  useEffect(() => {
    setUserHasManuallyScrolled(false);
    setInit(false);
    setContainerVisible(false);
    setIsScrollingToReply(false);
  }, [waveId]);


  useEffect(() => {
    void removeWaveDeliveredNotifications(waveId);
    void commonApiPostWithoutBodyAndResponse({
      endpoint: `notifications/wave/${waveId}/read`,
    }).catch((error) => console.error("Failed to mark feed as read:", error));
  }, [waveId]);

  const fetchAndScrollToDrop = useCallback(async () => {
    if (!serialNo || isScrolling) return;
    setIsScrolling(true); // Set scrolling true for the entire process
    await fetchNextPage(
      {
        waveId,
        type: DropSize.LIGHT,
        targetSerialNo: serialNo,
      },
      dropId
    );
    await waitAndRevealDrop(serialNo);
    const success = await smoothScrollWithRetries();
    setTimeout(() => {
      if (success) {
        setSerialNo(null);
        setIsScrolling(false);
      }
    }, 500);
  }, [
    waveId,
    fetchNextPage,
    serialNo,
    setIsScrolling,
    isScrolling,
    waitAndRevealDrop,
  ]);

  useEffect(() => {
    if (init && serialNo && !isScrolling) {
      const currentSmallestSerial = smallestSerialNo.current;
      // Check if already loaded before attempting scroll or fetch
      if (currentSmallestSerial && currentSmallestSerial <= serialNo) {
        const success = scrollToSerialNo("smooth");
        if (success) {
          setSerialNo(null);
        } else {
          fetchAndScrollToDrop();
        }
      } else {
        fetchAndScrollToDrop();
      }
    }
    return () => {
      // Cleanup logic if needed
    };
  }, [
    init,
    serialNo,
    fetchAndScrollToDrop,
    scrollToSerialNo,
    setSerialNo,
    isScrolling,
  ]);

  const handleTopIntersection = useCallback(async () => {
    const now = Date.now();
    // Add a 500ms cooldown to prevent rapid re-fetching
    if (now - lastLoadTime < 500) return;
    
    if (
      waveMessages?.hasNextPage &&
      !waveMessages?.isLoading &&
      !waveMessages?.isLoadingNextPage
    ) {
      setLastLoadTime(now);
      
      // Store current scroll height before loading
      const container = scrollContainerRef.current;
      const prevScrollHeight = container?.scrollHeight || 0;
      
      await fetchNextPage(
        {
          waveId,
          type: DropSize.FULL,
        },
        dropId
      );
      
      // Restore scroll position after new content loads
      if (container) {
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeight;
          container.scrollTop += scrollDiff;
        });
      }
    }
  }, [
    waveMessages?.hasNextPage,
    waveMessages?.isLoading,
    waveMessages?.isLoadingNextPage,
    fetchNextPage,
    lastLoadTime,
    scrollContainerRef,
    waveId,
    dropId,
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
          hasNextPage={!!waveMessages?.hasNextPage && (waveMessages?.drops?.length ?? 0) >= 25}
          onTopIntersection={handleTopIntersection}
          onUserScroll={(direction, isAtBottom) => {
            setIsAtBottom(isAtBottom);
            if (direction === "down") {
              setUserHasManuallyScrolled(true);
            }
          }}
>
          <DropsList
            scrollContainerRef={scrollContainerRef}
            onReplyClick={setSerialNo}
            drops={reversedDrops}
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
            if (scrollContainerRef.current) {
              const container = scrollContainerRef.current;
              const targetScrollTop = container.scrollHeight - container.clientHeight;
              
              // Set states immediately before scrolling
              setUserHasManuallyScrolled(false);
              setIsAtBottom(true);
              
              container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
              });
            }
          }}
        />

        <div
          className={`tw-absolute tw-bottom-0 tw-left-0 tw-z-10 tw-inset-x-0 tw-mr-2 tw-px-4 tw-py-1 tw-flex tw-items-center tw-gap-x-2 tw-bg-iron-950 tw-transition-opacity tw-duration-300 tw-ease-in-out ${
            typingMessage
              ? "tw-opacity-100 tw-visible"
              : "tw-opacity-0 tw-invisible tw-hidden"
          }`}>
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
    <div className={`tw-flex tw-flex-col tw-h-full tw-justify-start tw-relative tw-overflow-y-auto tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-border-x tw-border-t tw-border-b-0 ${containerVisible ? 'tw-opacity-100' : 'tw-opacity-0'} tw-transition-opacity tw-duration-200`}>
      {renderContent()}
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
}
