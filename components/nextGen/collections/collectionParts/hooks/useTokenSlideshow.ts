import { useCallback, useEffect, useState } from "react";
import { NextGenToken } from "../../../../../entities/INextgen";
import { commonApiFetch } from "../../../../../services/api/common-api";

const FETCH_SIZE = 50;
const DISPLAY_BUFFER = 20;
const FETCH_TRIGGER = 10;

interface UseTokenSlideshowReturn {
  displayTokens: NextGenToken[];
  isLoading: boolean;
  hasMore: boolean;
  onSlideChange: (slideIndex: number) => void;
}

export function useTokenSlideshow(
  collectionId: number,
  initialTokens: NextGenToken[] = []
): UseTokenSlideshowReturn {
  const [allTokens, setAllTokens] = useState<NextGenToken[]>(initialTokens);
  const [displayTokens, setDisplayTokens] = useState<NextGenToken[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreOnServer, setHasMoreOnServer] = useState(false);
  const [isLoading, setIsLoading] = useState(initialTokens.length === 0);

  const fetchMoreTokens = useCallback(async () => {
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: `nextgen/collections/${collectionId}/tokens?page_size=${FETCH_SIZE}&page=${currentPage}&sort=random`,
    }).then((response) => {
      setAllTokens((prev) => [...prev, ...response.data]);
      setHasMoreOnServer(response.next);
      setIsLoading(false);
    });
  }, [collectionId, currentPage]);

  // Initial fetch (skip if we have initial tokens)
  useEffect(() => {
    if (initialTokens.length === 0) {
      fetchMoreTokens();
    }
  }, [fetchMoreTokens, initialTokens.length]);

  // Update displayTokens when allTokens changes
  useEffect(() => {
    if (allTokens.length > 0 && displayTokens.length === 0) {
      setDisplayTokens(allTokens.slice(0, DISPLAY_BUFFER));
    }
  }, [allTokens, displayTokens.length]);

  // Handle scrolling - expand display or fetch more
  useEffect(() => {
    const remainingInDisplay = displayTokens.length - currentSlide;
    const remainingInAll = allTokens.length - displayTokens.length;

    // Need to expand displayTokens?
    if (remainingInDisplay <= 5 && remainingInAll > 0) {
      const newDisplayLength = Math.min(
        displayTokens.length + 10,
        allTokens.length
      );
      setDisplayTokens(allTokens.slice(0, newDisplayLength));
    }

    // Need to fetch more from server?
    if (remainingInAll <= FETCH_TRIGGER && hasMoreOnServer) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentSlide, displayTokens.length, allTokens, hasMoreOnServer]);

  const onSlideChange = useCallback((slideIndex: number) => {
    setCurrentSlide(slideIndex);
  }, []);

  return {
    displayTokens,
    isLoading,
    hasMore: Boolean(hasMoreOnServer),
    onSlideChange,
  };
}