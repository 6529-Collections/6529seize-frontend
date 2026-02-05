"use client";

import type { MouseEvent } from "react";
import { useCallback } from "react";
import { useSwipeDismiss } from "./useSwipeDismiss";
import { formatCountLabel } from "./wave-drops-scroll-controls.utils";

interface WaveDropsScrollControlsUnreadButtonProps {
  readonly unreadDividerSerialNo: number | null;
  readonly unreadCount?: number | undefined;
  readonly isPointingUp: boolean;
  readonly isCombined: boolean;
  readonly combinedWidthClassName: string;
  readonly roundedClassName: string;
  readonly onScrollToUnread: (serialNo: number) => void;
  readonly onDismissUnread: () => void;
}

export function WaveDropsScrollControlsUnreadButton({
  unreadDividerSerialNo,
  unreadCount,
  isPointingUp,
  isCombined,
  combinedWidthClassName,
  roundedClassName,
  onScrollToUnread,
  onDismissUnread,
}: WaveDropsScrollControlsUnreadButtonProps) {
  const { swipeOffset, swipeOpacity, consumeSuppressClick, handlers } =
    useSwipeDismiss({
      onDismiss: onDismissUnread,
    });

  const handleDismiss = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (consumeSuppressClick()) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      onDismissUnread();
    },
    [consumeSuppressClick, onDismissUnread]
  );

  const handleUnreadClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (consumeSuppressClick()) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (unreadDividerSerialNo !== null) {
        onScrollToUnread(unreadDividerSerialNo);
      }
    },
    [consumeSuppressClick, onScrollToUnread, unreadDividerSerialNo]
  );

  const unreadCountLabel = formatCountLabel(unreadCount);
  const hasUnreadCount = unreadCountLabel !== null;

  const unreadArrowIcon = (
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
  );

  const unreadContent = isCombined ? (
    unreadArrowIcon
  ) : (
    <>
      {unreadArrowIcon}
      {hasUnreadCount ? (
        <span className="tw-text-sm tw-font-medium">{unreadCountLabel}</span>
      ) : null}
    </>
  );

  return (
    <div
      className="tw-flex-shrink-0"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        opacity: swipeOpacity,
        transition: swipeOffset === 0 ? "all 0.2s ease-out" : "none",
      }}
    >
      <div className="tw-group tw-relative">
        <button
          onClick={handleDismiss}
          className="tw-absolute -tw-right-2 -tw-top-2 tw-z-50 tw-hidden tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-indigo-500 tw-text-white tw-opacity-0 tw-transition-all tw-duration-200 group-hover:tw-opacity-50 hover:!tw-opacity-100 lg:tw-flex"
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
          onClick={handleUnreadClick}
          onTouchStart={handlers.onTouchStart}
          onTouchMove={handlers.onTouchMove}
          onTouchEnd={handlers.onTouchEnd}
          onMouseDown={handlers.onMouseDown}
          onMouseMove={handlers.onMouseMove}
          onMouseUp={handlers.onMouseUp}
          onMouseLeave={handlers.onMouseLeave}
          className={`tw-flex tw-h-10 tw-min-w-[2.75rem] tw-items-center tw-justify-center tw-gap-2 tw-border-0 tw-bg-indigo-500 tw-px-4 tw-text-white tw-opacity-50 tw-transition-all tw-duration-300 hover:tw-opacity-100 lg:tw-h-8 ${roundedClassName} ${isCombined ? combinedWidthClassName : ""}`}
          aria-label="Scroll to first unread message"
        >
          {unreadContent}
        </button>
      </div>
    </div>
  );
}
