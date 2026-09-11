import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const SCROLL_END_THRESHOLD_PX = 24;

interface UseEULAScrollGateOptions {
  readonly mounted: boolean;
  readonly scrollButtonRef: RefObject<HTMLButtonElement | null>;
  readonly agreeButtonRef: RefObject<HTMLButtonElement | null>;
}

export function useEULAScrollGate({
  mounted,
  scrollButtonRef,
  agreeButtonRef,
}: UseEULAScrollGateOptions) {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const agreementContentRef = useRef<HTMLDivElement>(null);
  const completedScrollHeightRef = useRef<number | null>(null);
  const requiresScrollAfterContentGrowthRef = useRef(false);

  const updateScrollState = useCallback(
    (fromUserScroll = false) => {
      const element = scrollContainerRef.current;
      if (!element || element.clientHeight <= 0 || element.scrollHeight <= 0) {
        return;
      }

      const contentExpandedAfterCompletion =
        completedScrollHeightRef.current !== null &&
        element.scrollHeight > completedScrollHeightRef.current;
      if (contentExpandedAfterCompletion) {
        completedScrollHeightRef.current = null;
        requiresScrollAfterContentGrowthRef.current = true;
        setHasReachedBottom(false);
        setIsNearBottom(false);
        return;
      }

      const remainingScrollDistance =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      const nextIsNearBottom =
        remainingScrollDistance <= SCROLL_END_THRESHOLD_PX;

      if (requiresScrollAfterContentGrowthRef.current && !fromUserScroll) {
        setIsNearBottom(false);
        return;
      }

      setIsNearBottom(nextIsNearBottom);
      if (nextIsNearBottom) {
        const shouldFocusAgree =
          document.activeElement === scrollButtonRef.current;
        completedScrollHeightRef.current = element.scrollHeight;
        requiresScrollAfterContentGrowthRef.current = false;
        setHasReachedBottom(true);
        if (shouldFocusAgree) {
          globalThis.setTimeout(() => agreeButtonRef.current?.focus(), 0);
        }
      }
    },
    [agreeButtonRef, scrollButtonRef]
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

    updateScrollState();

    const scrollElement = scrollContainerRef.current;
    const contentElement = agreementContentRef.current;
    const resizeObserver =
      scrollElement && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollState())
        : null;
    if (scrollElement) {
      resizeObserver?.observe(scrollElement);
    }
    if (contentElement) {
      resizeObserver?.observe(contentElement);
    }

    return () => resizeObserver?.disconnect();
  }, [mounted, updateScrollState]);

  const scrollToBottom = () => {
    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return {
    agreementContentRef,
    handleScroll: () => updateScrollState(true),
    hasReachedBottom,
    isNearBottom,
    scrollContainerRef,
    scrollToBottom,
  };
}
