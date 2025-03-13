import React, { forwardRef, useRef, useEffect, useState } from "react";

interface WaveDropsScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
  readonly onTopIntersection: () => void;
  readonly newItemsCount: number;
  readonly isFetchingNextPage: boolean;
  readonly disableAutoPosition?: boolean;
}

const MIN_OUT_OF_VIEW_COUNT = 29;

export const WaveDropsScrollContainer = forwardRef<
  HTMLDivElement,
  WaveDropsScrollContainerProps
>(
  (
    {
      children,
      onScroll,
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

    // Track updates to handle scroll position adjustment
    const scrollAdjustmentRef = useRef<number | null>(null);
    const isAdjustingScrollRef = useRef(false);

    // The most reliable approach for Chrome with flex-col-reverse
    // Track DOM nodes directly to maintain position
    const lastVisibleElementRef = useRef<Element | null>(null);
    const lastVisibleOffset = useRef<number>(0);
    
    // Capture the last visible element and its position before changes happen
    useEffect(() => {
      if (!ref || !("current" in ref) || !ref.current) return;
      const container = ref.current;
      
      const captureVisibleElement = () => {
        if (contentRef.current) {
          // We'll look for elements that are at the vertical center of the viewport,
          // as these are the ones the user is likely looking at
          const containerRect = container.getBoundingClientRect();
          const centerY = containerRect.top + containerRect.height / 2;
          
          // Find all drop elements in the content area
          const dropElements = contentRef.current.querySelectorAll("[id^='drop-']");
          if (!dropElements || !dropElements.length) return;
          
          // Find the element closest to center point of the viewport
          let closestElement: Element | null = null;
          let closestDistance = Infinity;
          
          dropElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - centerY);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestElement = el;
            }
          });
          
          if (closestElement) {
            // Store references to this element for later use
            lastVisibleElementRef.current = closestElement;
            // Record the element's position relative to the viewport
            const rect = closestElement.getBoundingClientRect();
            lastVisibleOffset.current = rect.top - containerRect.top;
          }
        }
      };
      
      // When about to load new content
      if (newItemsCount > previousNewItemsCountRef.current) {
        captureVisibleElement();
      }
      
      previousNewItemsCountRef.current = newItemsCount;
    }, [newItemsCount, ref]);
    
    // Restore scroll position after content has loaded
    useEffect(() => {
      // Wait for a frame to make sure DOM is updated
      requestAnimationFrame(() => {
        if (!ref || !("current" in ref) || !ref.current) return;
        
        const scrollContainer = ref.current;
        const element = lastVisibleElementRef.current;
        
        if (element && !isAdjustingScrollRef.current) {
          isAdjustingScrollRef.current = true;
          
          // Calculate where the element is now
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const currentOffset = elementRect.top - containerRect.top;
          
          // Calculate how much to adjust by
          const adjustment = currentOffset - lastVisibleOffset.current;
          
          if (Math.abs(adjustment) > 5) { // Only adjust if significant change
            // In a reversed layout, we need to add the adjustment to scrollTop
            const newScrollTop = scrollContainer.scrollTop + adjustment;
            
            // Do the adjustment immediately with no animation
            scrollContainer.scrollTop = newScrollTop;
            
            // Clear after a small delay
            setTimeout(() => {
              isAdjustingScrollRef.current = false;
            }, 150);
          } else {
            isAdjustingScrollRef.current = false;
          }
        }
      });
    }, [newItemsCount, ref]);

    // Store initial height after first render
    useEffect(() => {
      if (contentRef.current) {
        previousHeightRef.current = contentRef.current.scrollHeight;
        previousNewItemsCountRef.current = newItemsCount;
      }
    }, []);
    
    // Add an intersection observer to detect when we're near the top 
    // In a reversed layout, this is the "top" of the container
    useEffect(() => {
      if (!contentRef.current || !ref || !("current" in ref) || ref.current === null || isFetchingNextPage) {
        return;
      }
      
      // Create a sentinel element for top detection
      const topSentinel = document.createElement('div');
      topSentinel.id = 'wave-drops-top-sentinel';
      topSentinel.style.height = '5px';
      topSentinel.style.width = '100%';
      topSentinel.style.position = 'relative';
      
      // Add sentinel as first element
      if (contentRef.current.firstChild) {
        contentRef.current.insertBefore(topSentinel, contentRef.current.firstChild);
      } else {
        contentRef.current.appendChild(topSentinel);
      }
      
      // Create intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !isFetchingNextPage) {
            onTopIntersection();
          }
        },
        {
          root: ref.current,
          rootMargin: '500px 0px 0px 0px', // Big top margin to detect early
          threshold: 0
        }
      );
      
      observer.observe(topSentinel);
      
      return () => {
        observer.disconnect();
        if (topSentinel.parentNode) {
          topSentinel.parentNode.removeChild(topSentinel);
        }
      };
    }, [ref, isFetchingNextPage, onTopIntersection]);

    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      // Skip handling if we're in the middle of a programmatic scroll adjustment
      if (isFetchingNextPage || isAdjustingScrollRef.current) {
        return;
      }
      if (throttleTimeoutRef.current) return;
      const { currentTarget } = event;
      const currentScrollTop = currentTarget.scrollTop;

      throttleTimeoutRef.current = setTimeout(() => {
        onScroll();
        // In a reversed layout:
        // - Scrolling UP visually (toward older content at the top) INCREASES scrollTop
        // - Scrolling DOWN visually (toward newer content at the bottom) DECREASES scrollTop
        const direction = currentScrollTop > lastScrollTop ? "up" : "down";
        setLastScrollTop(currentScrollTop);

        // We only want to load more when scrolling up toward older content
        if (direction === "down") {
          throttleTimeoutRef.current = null;
          return;
        }

        // Load more content when we're scrolling UP (toward older content)
        // In a reversed layout, scrolling UP means increasing scrollTop
        // and the user is approaching the "top" of the content which is
        // where older items are loaded
        if (direction === "up") {
          onTopIntersection();
        }

        throttleTimeoutRef.current = null;
      }, 100);
    };

    return (
      <div
        ref={ref}
        style={{ 
          // Prevent browser's automatic scroll anchoring - we'll handle it ourselves
          overflowAnchor: "none"
        }}
        className="tw-pb-2 tw-bg-iron-950 tw-flex tw-flex-col-reverse tw-flex-grow no-scrollbar tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 reversed-scroll-container"
        onScroll={handleScroll}
      >
        <div className="tw-flex-grow tw-relative">
          <div 
            ref={contentRef} 
            className="tw-overflow-hidden"
            style={{
              // Don't use browser's automatic anchoring
              overflowAnchor: "none"
            }}>
            {children}
          </div>
        </div>
      </div>
    );
  }
);

WaveDropsScrollContainer.displayName = "WaveDropsScrollContainer";
