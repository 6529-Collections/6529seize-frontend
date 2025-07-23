"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollBehavior = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);

  // scrollToVisualBottom scrolls to the newest messages (visually at the bottom)
  const scrollToVisualBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      // For a normal container, new messages (bottom) are at max scrollTop
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: behavior,
      });
    }
  }, [scrollContainerRef]);

  // scrollToVisualTop scrolls to the oldest messages (visually at the top)
  const scrollToVisualTop = useCallback(() => {
    if (scrollContainerRef.current) {
      // For a normal container, old messages (top) are at scrollTop = 0
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [scrollContainerRef]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;

      // In a normal container:
      const newIsAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // Visual bottom is at max scrollTop
      const newIsAtTop = scrollTop < 5; // Visual top is at scrollTop near 0

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
