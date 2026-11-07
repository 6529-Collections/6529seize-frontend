"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolveChatScrollBehavior,
  type ChatListHandle,
} from "@/components/waves/drops/chat-window/chatScrollBehavior";

type ScrollIntent = "pinned" | "reading" | "auto";

const BOTTOM_THRESHOLD_PX = 50;
const SCROLL_INTENT_DELTA_PX = 20;

const getScrollPosition = (container: HTMLDivElement, endAnchored: boolean) => {
  const { scrollTop, scrollHeight, clientHeight } = container;

  if (endAnchored) {
    // Normal order: the newest message is at the largest scrollTop.
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
    return {
      scrollTop,
      isAtBottom: distanceFromBottom < BOTTOM_THRESHOLD_PX,
      isAtTop: scrollTop < BOTTOM_THRESHOLD_PX,
    };
  }

  const distanceFromBottom = Math.abs(scrollTop);
  const isAtBottom = distanceFromBottom < BOTTOM_THRESHOLD_PX;

  const maxNegativeScroll = -(scrollHeight - clientHeight);
  const isAtTop = Math.abs(scrollTop - maxNegativeScroll) < BOTTOM_THRESHOLD_PX;

  return { scrollTop, isAtBottom, isAtTop };
};

interface BottomAnchorObserverOptions {
  readonly scrollContainerEl: HTMLDivElement | null;
  readonly bottomAnchorEl: HTMLDivElement | null;
  readonly setIsAtBottom: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setScrollIntentSafely: (nextIntent: ScrollIntent) => void;
}

const useBottomAnchorObserver = ({
  scrollContainerEl,
  bottomAnchorEl,
  setIsAtBottom,
  setScrollIntentSafely,
}: BottomAnchorObserverOptions) => {
  useEffect(() => {
    const container = scrollContainerEl;
    const anchor = bottomAnchorEl;
    if (!container || !anchor) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = Boolean(entry?.isIntersecting);
        setIsAtBottom(isIntersecting);

        // If anchor comes into view, we're definitely at bottom
        if (isIntersecting) {
          setScrollIntentSafely("pinned");
        }
      },
      {
        root: container,
        threshold: 0,
        rootMargin: "50px", // Handle layout shifts
      }
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
    };
  }, [scrollContainerEl, bottomAnchorEl, setIsAtBottom, setScrollIntentSafely]);
};

interface ScrollListenerOptions {
  readonly scrollContainerEl: HTMLDivElement | null;
  readonly handleScroll: () => void;
}

const useScrollListener = ({
  scrollContainerEl,
  handleScroll,
}: ScrollListenerOptions) => {
  useEffect(() => {
    const container = scrollContainerEl;
    if (!container) {
      return;
    }

    container.addEventListener("scroll", handleScroll);

    const initialScrollTimer = setTimeout(() => {
      handleScroll();
    }, 0);

    return () => {
      clearTimeout(initialScrollTimer);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [scrollContainerEl, handleScroll]);
};

const useScrollContainer = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollContainerEl, setScrollContainerEl] =
    useState<HTMLDivElement | null>(null);

  const syncScrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (scrollContainerRef.current === node) {
      return;
    }
    scrollContainerRef.current = node;
    setScrollContainerEl(node);
  }, []);

  return { scrollContainerRef, scrollContainerEl, syncScrollContainerRef };
};

const useBottomAnchor = () => {
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [bottomAnchorEl, setBottomAnchorEl] = useState<HTMLDivElement | null>(
    null
  );

  const syncBottomAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (bottomAnchorRef.current === node) {
      return;
    }
    bottomAnchorRef.current = node;
    setBottomAnchorEl(node);
  }, []);

  return { bottomAnchorRef, bottomAnchorEl, syncBottomAnchorRef };
};

const useScrollIntentState = () => {
  const [scrollIntent, setScrollIntent] = useState<ScrollIntent>("pinned");
  const scrollIntentRef = useRef<ScrollIntent>("pinned");

  const setScrollIntentSafely = useCallback((nextIntent: ScrollIntent) => {
    if (scrollIntentRef.current === nextIntent) {
      return;
    }
    scrollIntentRef.current = nextIntent;
    setScrollIntent(nextIntent);
  }, []);

  return { scrollIntent, setScrollIntentSafely };
};

interface ScrollBehaviorOptions {
  /**
   * The windowed chat: a normal-order list anchored to the newest message,
   * instead of a column-reverse box. The list takes `chatListRef`.
   */
  readonly endAnchored?: boolean | undefined;
}

export const useScrollBehavior = ({
  endAnchored = false,
}: ScrollBehaviorOptions = {}) => {
  const { scrollContainerRef, scrollContainerEl, syncScrollContainerRef } =
    useScrollContainer();
  const chatListRef = useRef<ChatListHandle | null>(null);
  const { bottomAnchorRef, bottomAnchorEl, syncBottomAnchorRef } =
    useBottomAnchor();
  const { scrollIntent, setScrollIntentSafely } = useScrollIntentState();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);
  const lastScrollTopRef = useRef(0);

  // scrollToVisualBottom scrolls to the newest messages (visually at the bottom)
  const forcePinToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      if (endAnchored) {
        // The windowed list scrolls to its end through the virtualizer, which
        // keeps the end as rows above it are measured.
        const chatList = chatListRef.current;
        if (chatList) {
          chatList.scrollToEnd(behavior);
        } else {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: resolveChatScrollBehavior(behavior),
          });
        }
        setScrollIntentSafely("pinned");
        setIsAtBottom(true);
        lastScrollTopRef.current =
          container.scrollHeight - container.clientHeight;
        return;
      }

      // For a flex-col-reverse container, new messages (bottom) are at scrollTop = 0
      container.scrollTo({
        top: 0,
        behavior,
      });

      // Reset to pinned when user manually scrolls to bottom
      setScrollIntentSafely("pinned");
      setIsAtBottom(true);
      lastScrollTopRef.current = 0;
    },
    [endAnchored, scrollContainerRef, setScrollIntentSafely]
  );

  const scrollToVisualBottom = useCallback(() => {
    // The windowed list jumps: a smooth scroll in flight would keep it from
    // following messages that arrive meanwhile.
    forcePinToBottom(endAnchored ? "auto" : "smooth");
  }, [endAnchored, forcePinToBottom]);

  // scrollToVisualTop scrolls to the oldest messages (visually at the top)
  const scrollToVisualTop = useCallback(() => {
    if (scrollContainerRef.current) {
      // For a flex-col-reverse container, old messages (top) need max scrollTop
      const container = scrollContainerRef.current;

      // Calculate maximum scroll position
      const maxScrollPosition = container.scrollHeight - container.clientHeight;

      // Set scroll position directly
      container.scrollTo({
        top: endAnchored ? 0 : -maxScrollPosition,
        behavior: endAnchored ? resolveChatScrollBehavior("smooth") : "smooth",
      });
    }
  }, [endAnchored, scrollContainerRef]);

  // Robust scroll detection with intent-based pinning
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const {
      scrollTop,
      isAtBottom: newIsAtBottom,
      isAtTop: newIsAtTop,
    } = getScrollPosition(container, endAnchored);

    setIsAtBottom(newIsAtBottom);
    setIsAtTop(newIsAtTop);

    // Intent detection - filter out small/accidental scrolls
    const scrollDelta = Math.abs(scrollTop - lastScrollTopRef.current);

    let nextIntent: ScrollIntent | null = null;

    if (scrollDelta > SCROLL_INTENT_DELTA_PX && !newIsAtBottom) {
      // Significant scroll away from bottom = user is reading
      nextIntent = "reading";
    } else if (newIsAtBottom) {
      // User scrolled back to bottom
      nextIntent = "pinned";
    }

    if (nextIntent) {
      setScrollIntentSafely(nextIntent);
    }

    lastScrollTopRef.current = scrollTop;
  }, [endAnchored, scrollContainerRef, setScrollIntentSafely]);

  const recomputeScrollMetrics = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { isAtBottom: newIsAtBottom, isAtTop: newIsAtTop } =
      getScrollPosition(container, endAnchored);

    setIsAtBottom(newIsAtBottom);
    setIsAtTop(newIsAtTop);
  }, [endAnchored, scrollContainerRef]);

  const recomputePinState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { isAtBottom: newIsAtBottom, isAtTop: newIsAtTop } =
      getScrollPosition(container, endAnchored);

    setIsAtBottom(newIsAtBottom);
    setIsAtTop(newIsAtTop);
  }, [endAnchored, scrollContainerRef]);

  // Intersection Observer for robust bottom detection
  useBottomAnchorObserver({
    scrollContainerEl,
    bottomAnchorEl,
    setIsAtBottom,
    setScrollIntentSafely,
  });

  useScrollListener({ scrollContainerEl, handleScroll });

  useEffect(() => {
    const container = scrollContainerEl;
    if (!container) {
      return;
    }
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      recomputeScrollMetrics();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollContainerEl, recomputeScrollMetrics]);

  // Should pin when user intends to stay at bottom AND is actually at bottom
  const shouldPinToBottom = scrollIntent === "pinned" && isAtBottom;

  return {
    scrollContainerRef,
    scrollContainerCallbackRef: syncScrollContainerRef,
    bottomAnchorRef,
    bottomAnchorCallbackRef: syncBottomAnchorRef,
    isAtBottom,
    isAtTop,
    shouldPinToBottom,
    scrollIntent,
    chatListRef,
    scrollToVisualBottom,
    forcePinToBottom,
    scrollToVisualTop,
    handleScroll,
    recomputePinState,
  };
};
