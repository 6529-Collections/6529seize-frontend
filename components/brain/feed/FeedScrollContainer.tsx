import React, { forwardRef, useRef, useState, useCallback, useEffect } from "react";

interface FeedScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScrollUpNearTop: () => void;
  readonly onScrollDownNearBottom?: () => void;
  readonly isFetchingNextPage?: boolean;
  readonly className?: string;
}

const MIN_OUT_OF_VIEW_COUNT = 30;

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
      className = "" 
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);
    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousHeightRef = useRef<number>(0);

    // Track height changes to maintain scroll position
    useEffect(() => {
      if (contentRef.current) {
        previousHeightRef.current = contentRef.current.scrollHeight;
        
        // Use a mutation observer to detect when items are added or removed
        const observer = new MutationObserver(() => {
          if (!contentRef.current || !ref || !("current" in ref) || !ref.current) return;
          
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
          subtree: true 
        });
        
        return () => observer.disconnect();
      }
    }, []);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      if (isFetchingNextPage || throttleTimeoutRef.current) return;
      
      const currentTarget = event.currentTarget;
      const currentScrollTop = currentTarget.scrollTop;

      throttleTimeoutRef.current = setTimeout(() => {
        const direction = currentScrollTop > lastScrollTop ? "down" : "up";
        setLastScrollTop(currentScrollTop);

        if (direction === "up" && onScrollUpNearTop) {
          const dropElements = contentRef.current?.querySelectorAll("[id^='feed-item-']");
          if (!dropElements) {
            throttleTimeoutRef.current = null;
            return;
          }

          const containerRect = currentTarget.getBoundingClientRect();
          let outOfViewCount = 0;

          dropElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < containerRect.top) {
              outOfViewCount++;
            }
          });

          if (outOfViewCount <= MIN_OUT_OF_VIEW_COUNT) {
            onScrollUpNearTop();
          }
        }

        if (direction === "down" && onScrollDownNearBottom) {
          const { scrollHeight, scrollTop, clientHeight } = currentTarget;
          const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

          if (scrolledToBottom) {
            onScrollDownNearBottom();
          }
        }

        throttleTimeoutRef.current = null;
      }, 100);
    }, [onScrollUpNearTop, onScrollDownNearBottom, lastScrollTop, isFetchingNextPage]);

    return (
      <div
        ref={ref}
        style={{ overflowAnchor: "none" }}
        className={`tw-flex tw-flex-col-reverse tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-h-full ${className}`}
        onScroll={handleScroll}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    );
  }
);

FeedScrollContainer.displayName = "FeedScrollContainer";
