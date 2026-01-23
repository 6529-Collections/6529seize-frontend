"use client";

import type { FC, RefObject } from "react";
import { useEffect, useState, useCallback, useRef } from "react";

type UnreadPosition = "hidden" | "above" | "below";

interface WaveDropsScrollToUnreadButtonProps {
  readonly unreadDividerSerialNo: number | null;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly onScrollToUnread: (serialNo: number) => void;
  readonly onDismiss: () => void;
}

const SWIPE_THRESHOLD = 25;

export const WaveDropsScrollToUnreadButton: FC<
  WaveDropsScrollToUnreadButtonProps
> = ({ unreadDividerSerialNo, scrollContainerRef, onScrollToUnread, onDismiss }) => {
  const [unreadPosition, setUnreadPosition] = useState<UnreadPosition>("hidden");
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeOffsetRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const checkUnreadVisibility = useCallback(() => {
    if (unreadDividerSerialNo === null) {
      setUnreadPosition("hidden");
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      setUnreadPosition("hidden");
      return;
    }

    const unreadElement = scrollContainer.querySelector(
      `#drop-${unreadDividerSerialNo}`
    );

    if (!unreadElement) {
      setUnreadPosition("above");
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = unreadElement.getBoundingClientRect();

    const isAboveViewport = elementRect.bottom < containerRect.top;
    const isBelowViewport = elementRect.top > containerRect.bottom;

    if (isAboveViewport) {
      setUnreadPosition("above");
    } else if (isBelowViewport) {
      setUnreadPosition("below");
    } else {
      setUnreadPosition("hidden");
    }
  }, [unreadDividerSerialNo, scrollContainerRef]);

  useEffect(() => {
    checkUnreadVisibility();

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      checkUnreadVisibility();
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new MutationObserver(() => {
      checkUnreadVisibility();
    });
    observer.observe(scrollContainer, { childList: true, subtree: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [checkUnreadVisibility, scrollContainerRef]);

  useEffect(() => {
    checkUnreadVisibility();
  }, [unreadDividerSerialNo, checkUnreadVisibility]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  }, [onDismiss]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null || !e.touches[0]) return;
    const deltaX = Math.max(0, e.touches[0].clientX - touchStartXRef.current);
    swipeOffsetRef.current = deltaX;
    setSwipeOffset(deltaX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeOffsetRef.current >= SWIPE_THRESHOLD) {
      onDismiss();
    }
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    touchStartXRef.current = null;
  }, [onDismiss]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    touchStartXRef.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) return;
    const deltaX = Math.max(0, e.clientX - touchStartXRef.current);
    swipeOffsetRef.current = deltaX;
    setSwipeOffset(deltaX);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (swipeOffsetRef.current >= SWIPE_THRESHOLD) {
      onDismiss();
    }
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    touchStartXRef.current = null;
    isDraggingRef.current = false;
  }, [onDismiss]);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      if (swipeOffsetRef.current >= SWIPE_THRESHOLD) {
        onDismiss();
      }
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
      touchStartXRef.current = null;
      isDraggingRef.current = false;
    }
  }, [onDismiss]);

  if (unreadPosition === "hidden" || unreadDividerSerialNo === null) {
    return null;
  }

  const handleClick = () => {
    onScrollToUnread(unreadDividerSerialNo);
  };

  const isPointingUp = unreadPosition === "above";
  const swipeOpacity = Math.max(0, 1 - swipeOffset / SWIPE_THRESHOLD);

  return (
    <div
      role="group"
      aria-label="New messages notification"
      className="tw-flex-shrink-0 tw-absolute tw-z-[49] tw-bottom-14 lg:tw-bottom-12 tw-right-2 lg:tw-right-6"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        opacity: swipeOpacity,
        transition: swipeOffset === 0 ? "all 0.2s ease-out" : "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="tw-relative tw-group">
        <button
          onClick={handleDismiss}
          className="tw-sr-only lg:tw-not-sr-only lg:tw-flex tw-opacity-0 group-hover:tw-opacity-100 tw-absolute -tw-top-2 -tw-right-2 tw-z-50 tw-size-6 tw-rounded-full tw-bg-rose-500 tw-text-white tw-items-center tw-justify-center hover:tw-bg-rose-600 tw-transition-all tw-duration-200 tw-border tw-border-solid tw-border-iron-950"
          aria-label="Dismiss"
        >
          <svg className="tw-size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={handleClick}
          className="tw-rounded-full tw-border-0 tw-bg-rose-500 tw-text-white tw-min-w-[2.75rem] tw-h-10 lg:tw-h-8 tw-px-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-opacity-75 hover:tw-opacity-100 tw-transition-all tw-duration-300"
          aria-label="Scroll to first unread message"
        >
          <svg
            className="tw-flex-shrink-0 tw-size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isPointingUp ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
            />
          </svg>
          <span className="tw-hidden lg:tw-inline tw-text-sm tw-font-medium">New messages</span>
        </button>
      </div>
    </div>
  );
};
