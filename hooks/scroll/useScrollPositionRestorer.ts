import { RefObject, useLayoutEffect, useRef } from "react";

// Threshold in pixels to consider the user scrolled to the bottom (visual top)
const NEAR_BOTTOM_THRESHOLD = 5;

export function useScrollPositionRestorer(
  scrollContainerRef: RefObject<HTMLElement | null>,
  isFetching: boolean
): void {
  const isFetchingPreviousRef = useRef<boolean>(false);
  const scrollHeightBeforeFetchRef = useRef<number>(0);
  const scrollTopBeforeFetchRef = useRef<number>(0);
  const wasNearBottomRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Record scroll metrics and position when fetching starts
    if (isFetching && !isFetchingPreviousRef.current) {
      scrollHeightBeforeFetchRef.current = container.scrollHeight;
      scrollTopBeforeFetchRef.current = container.scrollTop;
      // Check if scrolled near the bottom (visual top) before fetching
      wasNearBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        NEAR_BOTTOM_THRESHOLD;
    }

    // Adjust scroll position when fetching ends and content was added
    if (!isFetching && isFetchingPreviousRef.current) {
      const heightDifference =
        container.scrollHeight - scrollHeightBeforeFetchRef.current;

      if (heightDifference > 0) {
        if (wasNearBottomRef.current) {
          // If user was at the bottom, scroll to the new bottom
          container.scrollTop = container.scrollHeight - container.clientHeight;
        } else {
          // Otherwise, maintain scroll position relative to old content
          container.scrollTop = scrollTopBeforeFetchRef.current + heightDifference;
        }
      }
    }

    // Update the previous state reference for the next render cycle
    isFetchingPreviousRef.current = isFetching;
  }, [isFetching, scrollContainerRef]);
}
