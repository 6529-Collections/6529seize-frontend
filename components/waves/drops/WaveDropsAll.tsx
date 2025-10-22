"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import DropsList from "@/components/drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsReverseContainer } from "./WaveDropsReverseContainer";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { useRouter } from "next/navigation";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import WaveDropsEmptyPlaceholder from "./WaveDropsEmptyPlaceholder";
import WaveDropsScrollingOverlay from "./WaveDropsScrollingOverlay";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { useAuth } from "@/components/auth/Auth";

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

  useEffect(() => {
    if (initialDrop !== null) {
      setSerialNo((current) =>
        current === initialDrop ? current : initialDrop
      );
    }
  }, [initialDrop]);

  const {
    scrollContainerRef,
    bottomAnchorRef,
    isAtBottom,
    shouldPinToBottom,
    scrollIntent,
    scrollToVisualBottom,
  } = useScrollBehavior();

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollOperationAbortController = useRef<AbortController | null>(null);
  const scrollOperationLockRef = useRef(false);
  const SCROLL_OPERATION_TIMEOUT = 10000; // 10 seconds max for any scroll operation

  const scrollToSerialNo = useCallback(
    (behavior: ScrollBehavior) => {
      // Check if the target ref exists and is associated with the targetSerial
      if (targetDropRef.current && scrollContainerRef.current) {
        targetDropRef.current.scrollIntoView({
          behavior: behavior,
          block: "center",
        });

        // Check twice after small delays if element is still in viewport
        // This protects against layout shifts that might move the element
        setTimeout(() => {
          const rect = targetDropRef.current?.getBoundingClientRect();
          const isInViewport =
            rect && rect.top >= 0 && rect.bottom <= window.innerHeight;

          if (!isInViewport && targetDropRef.current) {
            targetDropRef.current.scrollIntoView({
              behavior: behavior,
              block: "center",
            });

            // Second check after another small delay
            setTimeout(() => {
              const rect = targetDropRef.current?.getBoundingClientRect();
              const isInViewport =
                rect && rect.top >= 0 && rect.bottom <= window.innerHeight;

              if (!isInViewport && targetDropRef.current) {
                targetDropRef.current.scrollIntoView({
                  behavior: behavior,
                  block: "center",
                });
              }
            }, 300);
          }
        }, 150);
        return true;
      }
      return false;
    },
    [] // No state dependencies needed here
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

  // Automatic timeout safety net - prevents isScrolling from staying true indefinitely
  useEffect(() => {
    if (!isScrolling) return;

    const timeoutId = setTimeout(() => {
      console.warn(
        "Scroll operation timed out after",
        SCROLL_OPERATION_TIMEOUT,
        "ms, clearing isScrolling state"
      );
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
      // Also abort any ongoing operation
      if (scrollOperationAbortController.current) {
        scrollOperationAbortController.current.abort();
        scrollOperationAbortController.current = null;
      }
    }, SCROLL_OPERATION_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [isScrolling, SCROLL_OPERATION_TIMEOUT]);

  // Cleanup on component unmount - prevent state leaks and cancel ongoing operations
  useEffect(() => {
    return () => {
      // Force cleanup if component unmounts while scrolling
      if (scrollOperationAbortController.current) {
        scrollOperationAbortController.current.abort();
        scrollOperationAbortController.current = null;
      }
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
    };
  }, []);

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

  // Effect for initial load and handling own temporary drops
  useEffect(() => {
    const currentMessages = latestWaveMessagesRef.current;
    if (currentMessages && currentMessages.drops.length > 0) {
      if (!init) setInit(true);

      const lastDrop = currentMessages.drops[0];
      if (lastDrop.id.startsWith("temp-") && shouldPinToBottom) {
        setTimeout(() => {
          scrollToVisualBottom();
        }, 100);
      }
    }
  }, [
    waveMessages,
    shouldPinToBottom,
    scrollToVisualBottom,
    init,
  ]); // Keep dependencies, logic uses ref

  useEffect(() => {
    void removeWaveDeliveredNotifications(waveId);
    void commonApiPostWithoutBodyAndResponse({
      endpoint: `notifications/wave/${waveId}/read`,
    }).catch((error) => console.error("Failed to mark feed as read:", error));
  }, [waveId]);

  const fetchAndScrollToDrop = useCallback(async () => {
    // Early guards using both state and ref for race condition protection
    if (!serialNo || isScrolling || scrollOperationLockRef.current) return;

    // Set both locks immediately (ref is synchronous, prevents double execution)
    scrollOperationLockRef.current = true;
    setIsScrolling(true);

    // Cancel any existing operation
    if (scrollOperationAbortController.current) {
      scrollOperationAbortController.current.abort();
    }

    // Create new abort controller for this operation
    scrollOperationAbortController.current = new AbortController();
    const signal = scrollOperationAbortController.current.signal;

    try {
      // Check if operation was cancelled before starting
      if (signal.aborted) {
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      await fetchNextPage(
        {
          waveId,
          type: DropSize.LIGHT,
          targetSerialNo: serialNo,
        },
        dropId
      );

      // Check if operation was cancelled after fetch
      if (signal.aborted) {
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      await waitAndRevealDrop(serialNo);

      // Check if operation was cancelled after reveal
      if (signal.aborted) {
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      const success = await smoothScrollWithRetries();

      // Only proceed with cleanup if operation wasn't cancelled
      if (!signal.aborted) {
        setTimeout(() => {
          if (success && !signal.aborted) {
            setSerialNo(null);
          }
        }, 500);
      }
    } catch (error) {
      // Log error but don't throw - we want to clean up gracefully
      if (!signal.aborted) {
        console.warn("Scroll operation failed:", error);
      }
    } finally {
      // Always reset both locks, regardless of success/failure/cancellation
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
    }
  }, [
    waveId,
    fetchNextPage,
    serialNo,
    isScrolling,
    waitAndRevealDrop,
    smoothScrollWithRetries,
    dropId,
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
    if (
      waveMessages?.hasNextPage &&
      !waveMessages?.isLoading &&
      !waveMessages?.isLoadingNextPage
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
  ]);

  const onQuoteClick = useCallback(
    (drop: ApiDrop) => {
      if (drop.wave.id !== waveId) {
        const waveDetails =
          (drop.wave as unknown as {
            chat?: { scope?: { group?: { is_direct_message?: boolean } } };
          }) ?? undefined;
        const isDirectMessage =
          waveDetails?.chat?.scope?.group?.is_direct_message ?? false;
        const href = getWaveRoute({
          waveId: drop.wave.id,
          serialNo: drop.serial_no,
          isDirectMessage,
          isApp: false,
        });
        router.push(href);
      } else {
        setSerialNo(drop.serial_no);
      }
    },
    [router, waveId]
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
          hasNextPage={
            !!waveMessages?.hasNextPage &&
            (waveMessages?.drops?.length ?? 0) >= 25
          }
          onTopIntersection={handleTopIntersection}
          onUserScroll={() => {
            // The useScrollBehavior hook now handles all scroll intent logic
            // This callback can be used for additional scroll-based features if needed
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
          {/* Bottom anchor for robust scroll detection */}
          <div ref={bottomAnchorRef} style={{ height: "1px" }} />
        </WaveDropsReverseContainer>
        <WaveDropsScrollBottomButton
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToVisualBottom}
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
    <div className="tw-flex tw-flex-col tw-h-full tw-justify-end tw-relative tw-overflow-y-auto tw-bg-iron-950">
      {renderContent()}
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
}
