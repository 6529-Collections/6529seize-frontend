"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ScrollIntent = 'pinned' | 'reading' | 'auto';

export const useScrollBehavior = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(false);
  const [scrollIntent, setScrollIntent] = useState<ScrollIntent>('pinned');
  
  const lastScrollTopRef = useRef(0);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // scrollToVisualBottom scrolls to the newest messages (visually at the bottom)
  const scrollToVisualBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      // For a flex-col-reverse container, new messages (bottom) are at scrollTop = 0
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      // Reset to pinned when user manually scrolls to bottom
      setScrollIntent('pinned');
    }
  }, []);

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
  }, []);

  // Robust scroll detection with intent-based pinning
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // In a flex-reversed container, check if we're near bottom with larger threshold
    const distanceFromBottom = Math.abs(scrollTop); // In flex-col-reverse, bottom is near 0
    const newIsAtBottom = distanceFromBottom < 50; // Increased threshold for layout shifts

    // For flex-col-reverse, visual top detection
    const maxNegativeScroll = -(scrollHeight - clientHeight);
    const newIsAtTop = Math.abs(scrollTop - maxNegativeScroll) < 50;

    setIsAtBottom(newIsAtBottom);
    setIsAtTop(newIsAtTop);

    // Intent detection - filter out small/accidental scrolls
    const scrollDelta = Math.abs(scrollTop - lastScrollTopRef.current);
    
    if (scrollDelta > 20 && !newIsAtBottom) {
      // Significant scroll away from bottom = user is reading
      setScrollIntent('reading');
    } else if (newIsAtBottom) {
      // User scrolled back to bottom
      setScrollIntent('pinned');
    }

    lastScrollTopRef.current = scrollTop;
  }, []);


  // Intersection Observer for robust bottom detection
  useEffect(() => {
    let rafId: number | null = null;
    let observer: IntersectionObserver | null = null;

    const setupObserver = () => {
      const container = scrollContainerRef.current;
      const anchor = bottomAnchorRef.current;

      if (!container || !anchor) {
        rafId = requestAnimationFrame(setupObserver);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          const isIntersecting = entry.isIntersecting;
          setIsAtBottom(isIntersecting);

          // If anchor comes into view, we're definitely at bottom
          if (isIntersecting) {
            setScrollIntent('pinned');
          }
        },
        {
          root: container,
          threshold: 0,
          rootMargin: '50px', // Handle layout shifts
        }
      );

      observer.observe(anchor);
    };

    setupObserver();

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    let attachedContainer: HTMLDivElement | null = null;

    const attachListener = () => {
      const container = scrollContainerRef.current;
      if (!container) {
        rafId = requestAnimationFrame(attachListener);
        return;
      }

      attachedContainer = container;
      container.addEventListener("scroll", handleScroll);
      // Run once to ensure initial state reflects current scroll position
      handleScroll();
    };

    attachListener();

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      if (attachedContainer) {
        attachedContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  // Should pin when user intends to stay at bottom AND is actually at bottom
  const shouldPinToBottom = scrollIntent === 'pinned' && isAtBottom;

  return {
    scrollContainerRef,
    bottomAnchorRef,
    isAtBottom,
    isAtTop,
    shouldPinToBottom,
    scrollIntent,
    scrollToVisualBottom,
    scrollToVisualTop,
    handleScroll,
  };
};
