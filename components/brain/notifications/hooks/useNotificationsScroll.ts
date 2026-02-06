"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import type { NotificationDisplayItem } from "@/types/feed.types";

interface UseNotificationsScrollParams {
  readonly items: NotificationDisplayItem[];
  readonly isAuthenticated: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly showLoader: boolean;
  readonly showNoItems: boolean;
  readonly showErrorState: boolean;
  readonly activeFilterKey: string;
}

interface UseNotificationsScrollResult {
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly handleTopIntersection: () => void;
}

export const useNotificationsScroll = ({
  items,
  isAuthenticated,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  showLoader,
  showNoItems,
  showErrorState,
  activeFilterKey,
}: UseNotificationsScrollParams): UseNotificationsScrollResult => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);

  const shouldEnableInfiniteScroll =
    isAuthenticated && !showLoader && !showNoItems && !showErrorState;

  const handleTopIntersection = useCallback(() => {
    if (!shouldEnableInfiniteScroll) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    shouldEnableInfiniteScroll,
  ]);

  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (!hasInitializedScrollRef.current) {
      scrollElement.scrollTop = 0;
      hasInitializedScrollRef.current = true;
    }
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      hasInitializedScrollRef.current = false;
    }
  }, [items.length]);

  useEffect(() => {
    hasInitializedScrollRef.current = false;
  }, [activeFilterKey]);

  return {
    scrollContainerRef,
    handleTopIntersection,
  };
};
