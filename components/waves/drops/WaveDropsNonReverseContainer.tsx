import React, { forwardRef, useRef, useEffect, useState } from "react";

interface WaveDropsNonReverseContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
  readonly onBottomIntersection: () => void; // For loading older content
  readonly onTopIntersection?: () => void; // For loading newer content
  readonly newItemsCount: number;
  readonly isFetchingNextPage: boolean;
  readonly disableAutoPosition?: boolean;
}

/**
 * A non-reversed scroll container that uses standard top-to-bottom layout
 * but visually appears reversed through CSS transforms
 */
export const WaveDropsNonReverseContainer = forwardRef<
  HTMLDivElement,
  WaveDropsNonReverseContainerProps
>(
  (
    {
      children,
      onScroll,
      onBottomIntersection,
      onTopIntersection,
      newItemsCount,
      isFetchingNextPage,
      disableAutoPosition,
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

      // For a chat interface, we only need a single sentinel element at the bottom
      // Since we only load older messages when scrolling up (logical top in our visual layout)
      const bottomSentinel = document.createElement("div");
      bottomSentinel.id = "wave-drops-older-content-sentinel";
      bottomSentinel.style.height = "5px";
      bottomSentinel.style.width = "100%";
      bottomSentinel.style.position = "relative";

      // Add sentinel at the "bottom" (logical top, but in our visual layout it's at the bottom)
      // This is where older content will load
      if (contentRef.current.firstChild) {
        contentRef.current.insertBefore(
          bottomSentinel,
          contentRef.current.firstChild
        );
      } else {
        contentRef.current.appendChild(bottomSentinel);
      }

      // Create intersection observer for bottom (older content)
      const bottomObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          // Only trigger if intersection is happening and we're not already fetching
          if (entry.isIntersecting && !isFetchingNextPage) {
            // In a chat, this loads older messages when scrolling up
            onBottomIntersection();
          }
        },
        {
          root: ref.current,
          // Much larger margin to detect early - 1000px should load content
          // well before the user reaches the top
          rootMargin: "1000px 0px 0px 0px",
          threshold: 0,
        }
      );

      bottomObserver.observe(bottomSentinel);

      return () => {
        bottomObserver.disconnect();

        if (bottomSentinel.parentNode) {
          bottomSentinel.parentNode.removeChild(bottomSentinel);
        }
      };
    }, [ref, isFetchingNextPage, onBottomIntersection]);

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

        // In a non-reversed layout, scrolling down means checking if we're near the bottom
        const direction = currentScrollTop > lastScrollTop ? "down" : "up";
        setLastScrollTop(currentScrollTop);

        // In a chat interface, we only load older content when scrolling up
        // Since we've used CSS transform to visually reverse direction,
        // scrolling up (to older content) is detected as direction === "up"
        if (direction === "up") {
          // Check if we're near top (that's where older content is in the logical structure)
          // Load more content when within 1000px of the top for a smoother experience
          if (currentScrollTop < 1000 && !isFetchingNextPage) {
            onBottomIntersection();
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
