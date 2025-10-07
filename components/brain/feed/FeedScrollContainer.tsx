"use client";

import React, {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { NEAR_TOP_SCROLL_THRESHOLD_PX } from "../constants";

interface FeedScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScrollUpNearTop: () => void;
  readonly onScrollDownNearBottom?: () => void;
  readonly isFetchingNextPage?: boolean;
  readonly className?: string;
}

const MIN_OUT_OF_VIEW_COUNT = 30;
const FEED_ITEM_SELECTOR = "[id^='feed-item-']";

export const FeedScrollContainer = forwardRef<
  HTMLDivElement,
  FeedScrollContainerProps
>(
  (
    {
      children,
      onScrollUpNearTop,
      onScrollDownNearBottom,
      isFetchingNextPage,
      className = "",
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);
    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousHeightRef = useRef<number>(0);
    const outOfViewAboveCountRef = useRef(0);
    const observedFeedItemsRef = useRef(new Map<Element, boolean>());

    // Track height changes to maintain scroll position
    useEffect(() => {
      if (contentRef.current) {
        previousHeightRef.current = contentRef.current.scrollHeight;

        // Use a mutation observer to detect when items are added or removed
        const observer = new MutationObserver(() => {
          if (
            !contentRef.current ||
            !ref ||
            !("current" in ref) ||
            !ref.current
          )
            return;

          const scrollContainer = ref.current;
          const currentHeight = contentRef.current.scrollHeight;
          const heightDifference = currentHeight - previousHeightRef.current;

          // Only adjust if there's a height change and we're not at the top
          if (heightDifference > 0 && scrollContainer.scrollTop > 0) {
            // Maintain the same view by adjusting scroll position by the height difference
            scrollContainer.scrollTop += heightDifference;
          }

          previousHeightRef.current = currentHeight;
        });

        observer.observe(contentRef.current, {
          childList: true,
          subtree: true,
        });

        return () => observer.disconnect();
      }
    }, []);

    useEffect(() => {
      if (
        !contentRef.current ||
        !ref ||
        typeof ref === "function" ||
        !("current" in ref) ||
        !ref.current
      ) {
        return;
      }

      const scrollContainer = ref.current;
      if (!scrollContainer) {
        return;
      }

      const updateOutOfViewCount = (element: Element, isAbove: boolean) => {
        const previous = observedFeedItemsRef.current.get(element) ?? false;

        if (previous === isAbove) {
          return;
        }

        observedFeedItemsRef.current.set(element, isAbove);
        outOfViewAboveCountRef.current += isAbove ? 1 : -1;

        if (outOfViewAboveCountRef.current < 0) {
          outOfViewAboveCountRef.current = 0;
        }
      };

      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const rootTop = entry.rootBounds?.top ?? scrollContainer.getBoundingClientRect().top;
            const isAbove =
              !entry.isIntersecting && entry.boundingClientRect.bottom <= rootTop;

            updateOutOfViewCount(entry.target, isAbove);
          }
        },
        {
          root: scrollContainer,
          threshold: 0,
        }
      );

      const observeElement = (element: Element) => {
        if (observedFeedItemsRef.current.has(element)) {
          return;
        }

        observedFeedItemsRef.current.set(element, false);
        intersectionObserver.observe(element);
      };

      const unobserveElement = (element: Element) => {
        if (!observedFeedItemsRef.current.has(element)) {
          return;
        }

        const wasAbove = observedFeedItemsRef.current.get(element) ?? false;
        if (wasAbove) {
          outOfViewAboveCountRef.current = Math.max(
            0,
            outOfViewAboveCountRef.current - 1
          );
        }

        observedFeedItemsRef.current.delete(element);
        intersectionObserver.unobserve(element);
      };

      const collectFeedItems = (node: Node): Element[] => {
        const feedItems: Element[] = [];

        if (node instanceof Element) {
          if (node.matches(FEED_ITEM_SELECTOR)) {
            feedItems.push(node);
          }

          for (const child of Array.from(
            node.querySelectorAll(FEED_ITEM_SELECTOR)
          )) {
            feedItems.push(child);
          }
        } else if (node instanceof DocumentFragment) {
          for (const child of Array.from(
            node.querySelectorAll(FEED_ITEM_SELECTOR)
          )) {
            feedItems.push(child);
          }
        }

        return feedItems;
      };

      const initializeFeedItems = () => {
        observedFeedItemsRef.current.clear();
        outOfViewAboveCountRef.current = 0;

        const initialElements = contentRef.current?.querySelectorAll(
          FEED_ITEM_SELECTOR
        );

        if (!initialElements) {
          return;
        }

        for (const element of Array.from(initialElements)) {
          // Ensure we observe each existing feed item exactly once
          observeElement(element);
        }
      };

      initializeFeedItems();

      const feedItemsMutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            for (const item of collectFeedItems(node)) {
              observeElement(item);
            }
          }

          for (const node of Array.from(mutation.removedNodes)) {
            for (const item of collectFeedItems(node)) {
              unobserveElement(item);
            }
          }
        }
      });

      feedItemsMutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
      });

      return () => {
        feedItemsMutationObserver.disconnect();
        intersectionObserver.disconnect();
        observedFeedItemsRef.current.clear();
        outOfViewAboveCountRef.current = 0;
      };
    }, [ref]);

    const handleScroll = useCallback(
      (event: React.UIEvent<HTMLDivElement>) => {
        if (isFetchingNextPage || throttleTimeoutRef.current) return;

        const currentTarget = event.currentTarget;

        throttleTimeoutRef.current = setTimeout(() => {
          const clearThrottle = () => {
            throttleTimeoutRef.current = null;
          };

          const latestScrollTop = currentTarget.scrollTop;
          const isNearTop =
            latestScrollTop <= NEAR_TOP_SCROLL_THRESHOLD_PX;

          const direction = latestScrollTop > lastScrollTop ? "down" : "up";
          setLastScrollTop(latestScrollTop);

          if (isNearTop) {
            onScrollUpNearTop();
            clearThrottle();
            return;
          }

          if (direction === "down") {
            if (onScrollDownNearBottom) {
              const { scrollHeight, scrollTop, clientHeight } = currentTarget;
              const scrolledToBottom =
                scrollHeight - scrollTop - clientHeight < 100;

              if (scrolledToBottom) {
                onScrollDownNearBottom();
              }
            }

            clearThrottle();
            return;
          }

          const outOfViewCount = outOfViewAboveCountRef.current;

          if (outOfViewCount <= MIN_OUT_OF_VIEW_COUNT) {
            onScrollUpNearTop();
          }

          clearThrottle();
        }, 100);
      },
      [
        onScrollUpNearTop,
        onScrollDownNearBottom,
        lastScrollTop,
        isFetchingNextPage,
      ]
    );

    return (
      <div
        ref={ref}
        style={{ overflowAnchor: "none" }}
        className={`tw-flex tw-flex-col-reverse tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-h-full ${className}`}
        onScroll={handleScroll}>
        <div ref={contentRef}>{children}</div>
      </div>
    );
  }
);

FeedScrollContainer.displayName = "FeedScrollContainer";
