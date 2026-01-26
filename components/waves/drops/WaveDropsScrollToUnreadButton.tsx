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
> = ({
  unreadDividerSerialNo,
  scrollContainerRef,
  onScrollToUnread,
  onDismiss,
}) => {
  const [unreadPosition, setUnreadPosition] =
    useState<UnreadPosition>("hidden");
  const [hasSeenDivider, setHasSeenDivider] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeOffsetRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const hasSeenDividerRef = useRef(false);
  const wasInViewRef = useRef<boolean | null>(null);
  const hasAutoDismissedRef = useRef(false);
  const lastSerialNoRef = useRef<number | null>(null);

  const checkUnreadVisibility = useCallback(() => {
    if (lastSerialNoRef.current !== unreadDividerSerialNo) {
      lastSerialNoRef.current = unreadDividerSerialNo;
      hasSeenDividerRef.current = false;
      wasInViewRef.current = null;
      hasAutoDismissedRef.current = false;
      setHasSeenDivider(false);
    }

    if (unreadDividerSerialNo === null) {
      setUnreadPosition("hidden");
      wasInViewRef.current = null;
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      setUnreadPosition("hidden");
      wasInViewRef.current = null;
      return;
    }

    const unreadElement = scrollContainer.querySelector(
      `#drop-${unreadDividerSerialNo}`
    );

    if (!unreadElement) {
      setUnreadPosition("above");
      wasInViewRef.current = null;
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = unreadElement.getBoundingClientRect();

    const isAboveViewport = elementRect.bottom < containerRect.top;
    const isBelowViewport = elementRect.top > containerRect.bottom;
    const isInView = !isAboveViewport && !isBelowViewport;
    const wasInView = wasInViewRef.current === true;

    if (isInView) {
      if (!hasSeenDividerRef.current) {
        hasSeenDividerRef.current = true;
        setHasSeenDivider(true);
      }
      setUnreadPosition("hidden");
    } else {
      if (
        hasSeenDividerRef.current &&
        wasInView &&
        !hasAutoDismissedRef.current
      ) {
        hasAutoDismissedRef.current = true;
        onDismiss();
      }
      setUnreadPosition(isAboveViewport ? "above" : "below");
    }
    wasInViewRef.current = isInView;
  }, [unreadDividerSerialNo, scrollContainerRef, onDismiss]);

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

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      if (suppressClickRef.current) {
        e.stopPropagation();
        e.preventDefault();
        suppressClickRef.current = false;
        return;
      }
      e.stopPropagation();
      onDismiss();
    },
    [onDismiss]
  );

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
      suppressClickRef.current = true;
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
      suppressClickRef.current = true;
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
        suppressClickRef.current = true;
        onDismiss();
      }
      swipeOffsetRef.current = 0;
      setSwipeOffset(0);
      touchStartXRef.current = null;
      isDraggingRef.current = false;
    }
  }, [onDismiss]);

  if (
    unreadPosition === "hidden" ||
    unreadDividerSerialNo === null ||
    hasSeenDivider
  ) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    onScrollToUnread(unreadDividerSerialNo);
  };

  const isPointingUp = unreadPosition === "above";
  const swipeOpacity = Math.max(0, 1 - swipeOffset / SWIPE_THRESHOLD);

  return (
    <div
      className="tw-absolute tw-bottom-14 tw-right-2 tw-z-[49] tw-flex-shrink-0 lg:tw-bottom-12 lg:tw-right-6"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        opacity: swipeOpacity,
        transition: swipeOffset === 0 ? "all 0.2s ease-out" : "none",
      }}
    >
      <div className="tw-group tw-relative">
        <button
          onClick={handleDismiss}
          className="tw-absolute -tw-right-2 -tw-top-2 tw-z-50 tw-hidden tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-950 tw-bg-rose-500 tw-text-white tw-opacity-0 tw-transition-all tw-duration-200 group-hover:tw-opacity-100 hover:tw-bg-rose-600 lg:tw-flex"
          aria-label="Dismiss"
        >
          <svg
            className="tw-size-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="tw-flex tw-h-10 tw-min-w-[2.75rem] tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-0 tw-bg-rose-500 tw-px-4 tw-text-white tw-opacity-75 tw-transition-all tw-duration-300 hover:tw-opacity-100 lg:tw-h-8"
          aria-label="Scroll to first unread message"
        >
          <svg
            className="tw-size-4 tw-flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={
                isPointingUp
                  ? "M5 10l7-7m0 0l7 7m-7-7v18"
                  : "M19 14l-7 7m0 0l-7-7m7 7V3"
              }
            />
          </svg>
          <span className="tw-hidden tw-text-sm tw-font-medium lg:tw-inline">
            New messages
          </span>
        </button>
      </div>
    </div>
  );
};
