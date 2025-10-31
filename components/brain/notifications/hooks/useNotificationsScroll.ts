"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type UIEventHandler,
} from "react";
import type { TypedNotification } from "@/types/feed.types";
import { NEAR_TOP_SCROLL_THRESHOLD_PX } from "../../constants";
import {
  STICK_TO_BOTTOM_SCROLL_THRESHOLD_PX,
} from "../utils/constants";

interface UseNotificationsScrollParams {
  readonly items: TypedNotification[];
  readonly isAuthenticated: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly showLoader: boolean;
  readonly showNoItems: boolean;
  readonly showErrorState: boolean;
  readonly activeFilterKey: string;
}

interface UseNotificationsScrollResult {
  readonly scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  readonly handleScroll: UIEventHandler<HTMLDivElement>;
}

export const useNotificationsScroll = ({
  items,
  isAuthenticated,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  showLoader,
  showNoItems,
  showErrorState,
  activeFilterKey,
}: UseNotificationsScrollParams): UseNotificationsScrollResult => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);
  const isPinnedToBottomRef = useRef(true);
  const isPrependingRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const lastMeasuredScrollHeightRef = useRef(0);

  const shouldEnableInfiniteScroll =
    isAuthenticated && !showLoader && !showNoItems && !showErrorState;

  const triggerFetchOlder = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    const container = scrollContainerRef.current;
    if (container) {
      previousScrollHeightRef.current = container.scrollHeight;
    }
    isPrependingRef.current = true;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isAuthenticated, isFetchingNextPage]);

  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (!hasInitializedScrollRef.current) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
      hasInitializedScrollRef.current = true;
      isPinnedToBottomRef.current = true;
    }
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      hasInitializedScrollRef.current = false;
      isPrependingRef.current = false;
      previousScrollHeightRef.current = 0;
      isPinnedToBottomRef.current = true;
    }
  }, [items.length]);

  useEffect(() => {
    hasInitializedScrollRef.current = false;
    isPrependingRef.current = false;
    isPinnedToBottomRef.current = true;
  }, [activeFilterKey]);

  useLayoutEffect(() => {
    if (!isPrependingRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      isPrependingRef.current = false;
      return;
    }

    const delta = container.scrollHeight - previousScrollHeightRef.current;
    if (delta !== 0) {
      container.scrollTop += delta;
    }

    isPrependingRef.current = false;
  }, [items]);

  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    const observationTarget =
      (scrollElement.firstElementChild as HTMLElement | null) ?? scrollElement;

    let rafId: number | null = null;

    const scheduleStickToBottom = () => {
      if (!hasInitializedScrollRef.current || !isPinnedToBottomRef.current) {
        return;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) {
          return;
        }

        container.scrollTop = container.scrollHeight;
        rafId = null;
      });
    };

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        scheduleStickToBottom();
      });

      resizeObserver.observe(observationTarget);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        resizeObserver.disconnect();
      };
    }

    const intervalId = globalThis.setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      if (!hasInitializedScrollRef.current || !isPinnedToBottomRef.current) {
        return;
      }

      const currentScrollHeight = container.scrollHeight;
      if (currentScrollHeight !== lastMeasuredScrollHeightRef.current) {
        lastMeasuredScrollHeightRef.current = currentScrollHeight;
        scheduleStickToBottom();
      }
    }, 250);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      globalThis.clearInterval(intervalId);
    };
  }, [items, showErrorState, showLoader, showNoItems]);

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const container = event.currentTarget;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom =
        distanceFromBottom <= STICK_TO_BOTTOM_SCROLL_THRESHOLD_PX;

      if (isNearBottom) {
        isPinnedToBottomRef.current = true;
      } else if (
        distanceFromBottom > STICK_TO_BOTTOM_SCROLL_THRESHOLD_PX
      ) {
        isPinnedToBottomRef.current = false;
      }

      if (!shouldEnableInfiniteScroll) {
        return;
      }

      if (container.scrollTop <= NEAR_TOP_SCROLL_THRESHOLD_PX) {
        if (!isFetchingNextPage && hasNextPage) {
          triggerFetchOlder();
        }
      }
    },
    [
      hasNextPage,
      isFetchingNextPage,
      shouldEnableInfiniteScroll,
      triggerFetchOlder,
    ]
  );

  return {
    scrollContainerRef,
    handleScroll,
  };
};
