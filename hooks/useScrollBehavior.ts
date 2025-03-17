import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollBehavior = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      // In our non-reversed container, bottom is the actual bottom
      const scrollHeight = scrollContainerRef.current.scrollHeight;
      const clientHeight = scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      // In our non-reversed container, top is the actual top
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // In our non-reversed container, these are flipped from the previous logic
      const newIsAtBottom = Math.abs(scrollTop - (scrollHeight - clientHeight)) < 5;
      const newIsAtTop = scrollTop === 0;
      
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
    scrollToBottom,
    scrollToTop,
    handleScroll,
  };
};
