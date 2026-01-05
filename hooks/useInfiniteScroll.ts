import { useEffect, useRef } from "react";

export function useInfiniteScroll(
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  sentinelRef: React.RefObject<HTMLElement | null>,
  rootMargin = "100px"
) {
  const fetchingRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (!sentinel || !scrollContainer || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !fetchingRef.current
        ) {
          fetchingRef.current = true;
          fetchNextPage();
        }
      },
      {
        root: scrollContainer,
        rootMargin,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      fetchingRef.current = false;
    };
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollContainerRef,
    sentinelRef,
    rootMargin,
  ]);

  // Reset fetching flag when fetch completes
  useEffect(() => {
    if (!isFetchingNextPage) {
      fetchingRef.current = false;
    }
  }, [isFetchingNextPage]);
}