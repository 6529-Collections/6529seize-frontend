"use client";

import type { FC, RefObject } from "react";
import { useEffect, useState, useCallback } from "react";

type UnreadPosition = "hidden" | "above" | "below";

interface WaveDropsScrollToUnreadButtonProps {
  readonly unreadDividerSerialNo: number | null;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly onScrollToUnread: (serialNo: number) => void;
}

export const WaveDropsScrollToUnreadButton: FC<
  WaveDropsScrollToUnreadButtonProps
> = ({ unreadDividerSerialNo, scrollContainerRef, onScrollToUnread }) => {
  const [unreadPosition, setUnreadPosition] =
    useState<UnreadPosition>("hidden");

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

  if (unreadPosition === "hidden" || unreadDividerSerialNo === null) {
    return null;
  }

  const handleClick = () => {
    onScrollToUnread(unreadDividerSerialNo);
  };

  const isPointingUp = unreadPosition === "above";

  return (
    <button
      onClick={handleClick}
      className="tw-absolute tw-bottom-14 tw-right-2 tw-z-[49] tw-flex tw-h-10 tw-min-w-[2.75rem] tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-0 tw-bg-rose-500 tw-px-4 tw-text-white tw-opacity-75 tw-transition-all tw-duration-300 hover:tw-opacity-100 lg:tw-bottom-12 lg:tw-right-6 lg:tw-h-8"
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
  );
};
