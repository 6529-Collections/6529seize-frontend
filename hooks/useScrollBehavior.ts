"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type ScrollIntent = "pinned" | "reading";

const BOTTOM_THRESHOLD = 48;
const TOP_THRESHOLD = 48;
const INTENT_THRESHOLD = 20;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getMetrics = (element: HTMLDivElement) => {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const maxScroll = Math.max(scrollHeight - clientHeight, 0);
  const normalizedTop = clamp(maxScroll + scrollTop, 0, maxScroll);
  const distanceFromBottom = maxScroll - normalizedTop;
  const distanceFromTop = normalizedTop;

  return {
    scrollTop,
    distanceFromBottom,
    distanceFromTop,
  };
};

export const useScrollBehavior = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);
  const [scrollIntent, setScrollIntent] = useState<ScrollIntent>("pinned");

  const lastScrollTopRef = useRef(0);
  const intentRef = useRef<ScrollIntent>("pinned");
  const isAtBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const setIntent = useCallback((nextIntent: ScrollIntent) => {
    if (intentRef.current !== nextIntent) {
      intentRef.current = nextIntent;
      setScrollIntent(nextIntent);
    }
  }, []);

  const updateScrollState = useCallback((element: HTMLDivElement) => {
    const { distanceFromBottom, distanceFromTop, scrollTop } =
      getMetrics(element);

    const nearBottom = distanceFromBottom <= BOTTOM_THRESHOLD;
    const nearTop = distanceFromTop <= TOP_THRESHOLD;

    setIsAtBottom(nearBottom);
    setIsAtTop(nearTop);
    isAtBottomRef.current = nearBottom;

    const delta = Math.abs(scrollTop - lastScrollTopRef.current);

    if (delta > INTENT_THRESHOLD && !nearBottom) {
      setIntent("reading");
    } else if (nearBottom) {
      setIntent("pinned");
    }

    lastScrollTopRef.current = scrollTop;
  }, [setIntent]);

  const handleScroll = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }

    updateScrollState(element);
  }, [updateScrollState]);

  const scrollToVisualBottom = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }

    setIntent("pinned");
    element.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        updateScrollState(scrollContainerRef.current);
      }
    });
  }, [setIntent, updateScrollState]);

  const scrollToVisualTop = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }

    const maxScroll = Math.max(element.scrollHeight - element.clientHeight, 0);
    setIntent("reading");
    element.scrollTo({
      top: -maxScroll,
      behavior: "smooth",
    });
  }, [setIntent]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const anchor = bottomAnchorRef.current;

    if (!container || !anchor || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
        isAtBottomRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setIntent("pinned");
        }
      },
      {
        root: container,
        threshold: 0,
        rootMargin: "48px",
      }
    );

    observer.observe(anchor);

    return () => observer.disconnect();
  }, [setIntent]);

  useLayoutEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }

    const handleContentResize = () => {
      const target = scrollContainerRef.current;
      if (!target) {
        return;
      }

      const previousHeight = prevScrollHeightRef.current;
      const currentHeight = target.scrollHeight;

      if (previousHeight === 0) {
        prevScrollHeightRef.current = currentHeight;
        lastScrollTopRef.current = target.scrollTop;
        return;
      }

      if (previousHeight === currentHeight) {
        return;
      }

      const heightDelta = currentHeight - previousHeight;
      if (heightDelta === 0) {
        prevScrollHeightRef.current = currentHeight;
        lastScrollTopRef.current = target.scrollTop;
        return;
      }

      const shouldStickToBottom =
        intentRef.current === "pinned" && isAtBottomRef.current;

      if (shouldStickToBottom) {
        target.scrollTop = 0;
      } else {
        const newMaxScroll = Math.max(target.scrollHeight - target.clientHeight, 0);
        const desiredScrollTop = Math.max(
          -newMaxScroll,
          Math.min(0, lastScrollTopRef.current)
        );
        target.scrollTop = desiredScrollTop;
      }

      prevScrollHeightRef.current = target.scrollHeight;
      lastScrollTopRef.current = target.scrollTop;
      updateScrollState(target);
    };

    prevScrollHeightRef.current = element.scrollHeight;
    lastScrollTopRef.current = element.scrollTop;

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(handleContentResize);
      resizeObserver.observe(element);
      resizeObserverRef.current = resizeObserver;

      return () => {
        resizeObserver.disconnect();
        resizeObserverRef.current = null;
      };
    }

    if (typeof MutationObserver !== "undefined") {
      const mutationObserver = new MutationObserver(handleContentResize);
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      mutationObserverRef.current = mutationObserver;

      return () => {
        mutationObserver.disconnect();
        mutationObserverRef.current = null;
      };
    }

    const intervalId = window.setInterval(handleContentResize, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [updateScrollState]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      resizeObserverRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
    };
  }, []);

  const shouldPinToBottom = scrollIntent === "pinned" && isAtBottom;

  return {
    scrollContainerRef,
    bottomAnchorRef,
    isAtBottom,
    isAtTop,
    shouldPinToBottom,
    scrollIntent,
    scrollToVisualBottom,
    scrollToVisualTop,
    handleScroll,
  };
};
