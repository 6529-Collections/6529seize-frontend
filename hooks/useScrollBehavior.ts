"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollBehavior = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);

  // scrollToVisualBottom scrolls to the newest messages (visually at the bottom)
  const scrollToVisualBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      // For a flex-col-reverse container, new messages (bottom) are at scrollTop = 0
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [scrollContainerRef]);

  // scrollToVisualTop scrolls to the oldest messages (visually at the top)
  const scrollToVisualTop = useCallback(() => {
    if (scrollContainerRef.current) {
      // For a flex-col-reverse container, old messages (top) need max scrollTop
      const container = scrollContainerRef.current;

      // Calculate maximum scroll position
      const maxScrollPosition = container.scrollHeight - container.clientHeight;

      // Set scroll position directly
      container.scrollTo({
        top: -maxScrollPosition,
        behavior: "smooth",
      });
    }
  }, [scrollContainerRef]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;

      // In a flex-reversed container:
      const newIsAtBottom = scrollTop < 5; // Visual bottom is at scrollTop near 0

      // For flex-col-reverse, we may need to check large negative values
      // Visual top is at the most negative scrollTop value
      const maxNegativeScroll = -(scrollHeight - clientHeight);
      const newIsAtTop = Math.abs(scrollTop - maxNegativeScroll) < 5;

      setIsAtBottom(newIsAtBottom);
      setIsAtTop(newIsAtTop);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return {
    scrollContainerRef,
    isAtBottom,
    isAtTop,
    scrollToVisualBottom,
    scrollToVisualTop,
    handleScroll,
  };
};
