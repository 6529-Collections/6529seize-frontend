import React, { forwardRef, useRef, useEffect, useState } from "react";

interface WaveDropsNonReverseContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
  readonly onTopIntersection: () => void;
  readonly newItemsCount: number;
  readonly isFetchingNextPage: boolean;
  readonly disableAutoPosition?: boolean;
  readonly onUserScroll?: (direction: 'up' | 'down', isAtBottom: boolean) => void;
}

/**
 * A standard scroll container that uses normal top-to-bottom layout
 * for displaying content like chat messages
 */
export const WaveDropsNonReverseContainer = forwardRef<
  HTMLDivElement,
  WaveDropsNonReverseContainerProps
>(
  (
    {
      children,
      onScroll,
      onTopIntersection,
      newItemsCount,
      isFetchingNextPage,
      disableAutoPosition,
      onUserScroll,
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);
    const previousHeightRef = useRef<number>(0);
    const previousNewItemsCountRef = useRef<number>(0);

    // Create observers to detect when we reach the bottom (for older items)
    // and top (for newer items)
    useEffect(() => {
      if (
        !contentRef.current ||
        !ref ||
        !("current" in ref) ||
        !ref.current ||
        isFetchingNextPage
      ) {
        return;
      }

      // For a chat interface, we need a sentinel element at the top
      // to detect when we should load older messages when scrolling up
      const topSentinel = document.createElement("div");
      topSentinel.id = "wave-drops-older-content-sentinel";
      topSentinel.style.height = "5px";
      topSentinel.style.width = "100%";
      topSentinel.style.position = "relative";

      // Add sentinel at the top of the container
      // This is where older content will load
      if (contentRef.current.firstChild) {
        contentRef.current.insertBefore(
          topSentinel,
          contentRef.current.firstChild
        );
      } else {
        contentRef.current.appendChild(topSentinel);
      }

      // Create intersection observer for top (older content)
      const topObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          // Only trigger if intersection is happening and we're not already fetching
          if (entry.isIntersecting && !isFetchingNextPage) {
            // In a chat, this loads older messages when scrolling up
            onTopIntersection();
          }
        },
        {
          root: ref.current,
          // Much larger margin to detect early - 1000px should load content
          // well before the user reaches the top
          rootMargin: "2000px 0px 0px 0px",
          threshold: 0,
        }
      );

      topObserver.observe(topSentinel);

      return () => {
        topObserver.disconnect();

        if (topSentinel.parentNode) {
          topSentinel.parentNode.removeChild(topSentinel);
        }
      };
    }, [ref, isFetchingNextPage, onTopIntersection]);

    // Store initial height after first render
    useEffect(() => {
      if (contentRef.current) {
        previousHeightRef.current = contentRef.current.scrollHeight;
        previousNewItemsCountRef.current = newItemsCount;
      }
    }, []);

    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track if initial scroll has been performed
    const hasInitialScrolledRef = useRef(false);
    
    // For initial auto-scroll - only run once on mount if not disabled
    useEffect(() => {
      if (ref && 
          "current" in ref && 
          ref.current && 
          !disableAutoPosition && 
          !hasInitialScrolledRef.current) {
        
        // For a chat interface, scroll to bottom on initial load
        const container = ref.current;
        container.scrollTop = container.scrollHeight;
        hasInitialScrolledRef.current = true;
      }
    }, [disableAutoPosition]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      if (isFetchingNextPage) {
        return;
      }
      if (throttleTimeoutRef.current) return;
      const { currentTarget } = event;
      const currentScrollTop = currentTarget.scrollTop;

      throttleTimeoutRef.current = setTimeout(() => {
        onScroll();

        // Determine if we're scrolling up or down
        const direction = currentScrollTop > lastScrollTop ? "down" : "up";
        
        // Calculate if we're at the bottom for user scroll detection
        const isCurrentlyAtBottom = Math.abs(
          currentScrollTop - (currentTarget.scrollHeight - currentTarget.clientHeight)
        ) < 5;
        
        // Report user scroll with direction and bottom status
        if (onUserScroll) {
          onUserScroll(direction, isCurrentlyAtBottom);
        }
        
        setLastScrollTop(currentScrollTop);

        // In a chat interface, we only load older content when scrolling up
        // as older messages are rendered at the top of the container
        if (direction === "up") {
          // Check if we're near the top of the container
          // Load more content when within 1000px of the top for a smoother experience
          if (currentScrollTop < 1000 && !isFetchingNextPage) {
            onTopIntersection();
          }
        }

        throttleTimeoutRef.current = null;
      }, 100);
    };

    return (
      <div
        ref={ref}
        className="tw-pb-2 tw-bg-iron-950 tw-flex-grow tw-overflow-y-auto tw-overflow-x-hidden no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 standard-scroll-container"
        onScroll={handleScroll}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    );
  }
);

WaveDropsNonReverseContainer.displayName = "WaveDropsNonReverseContainer";
