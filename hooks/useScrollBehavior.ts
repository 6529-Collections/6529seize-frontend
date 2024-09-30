import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollBehavior = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);
  const [shouldScrollDownAfterNewPosts, setShouldScrollDownAfterNewPosts] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTo({
        top: -scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const newIsAtBottom = scrollTop === 0;
      const newIsAtTop = scrollTop === scrollHeight - clientHeight;
      const newShouldScrollDownAfterNewPosts = scrollTop > -60;
      setIsAtBottom(newIsAtBottom);
      setIsAtTop(newIsAtTop);
      setShouldScrollDownAfterNewPosts(newShouldScrollDownAfterNewPosts);
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
    shouldScrollDownAfterNewPosts,
    scrollToBottom,
    scrollToTop,
    handleScroll,
  };
};