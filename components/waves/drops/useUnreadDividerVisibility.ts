"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { RefObject } from "react";

type UnreadPosition = "hidden" | "above" | "below";

interface UseUnreadDividerVisibilityArgs {
  readonly unreadDividerSerialNo: number | null;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly onDismissUnread: () => void;
}

export function useUnreadDividerVisibility({
  unreadDividerSerialNo,
  scrollContainerRef,
  onDismissUnread,
}: UseUnreadDividerVisibilityArgs) {
  const [unreadPosition, setUnreadPosition] =
    useState<UnreadPosition>("hidden");
  const [hasSeenDivider, setHasSeenDivider] = useState(false);
  const [dismissedSerialNo, setDismissedSerialNo] = useState<number | null>(
    null
  );
  const hasSeenDividerRef = useRef(false);
  const wasInViewRef = useRef<boolean | null>(null);
  const hasAutoDismissedRef = useRef(false);
  const lastSerialNoRef = useRef<number | null>(null);

  const dismissUnread = useCallback(() => {
    if (unreadDividerSerialNo === null) return;
    setDismissedSerialNo(unreadDividerSerialNo);
    onDismissUnread();
  }, [onDismissUnread, unreadDividerSerialNo]);

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
        onDismissUnread();
      }
      setUnreadPosition(isAboveViewport ? "above" : "below");
    }
    wasInViewRef.current = isInView;
  }, [unreadDividerSerialNo, scrollContainerRef, onDismissUnread]);

  useEffect(() => {
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

    scrollContainer.dispatchEvent(new Event("scroll"));

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [checkUnreadVisibility, scrollContainerRef]);

  const isUserDismissed =
    unreadDividerSerialNo !== null &&
    dismissedSerialNo === unreadDividerSerialNo;
  const isUnreadVisible =
    unreadPosition !== "hidden" &&
    unreadDividerSerialNo !== null &&
    !hasSeenDivider &&
    !isUserDismissed;

  useEffect(() => {
    if (!isUnreadVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const active = document.activeElement;
      if (active?.closest('[role="dialog"]')) return;
      dismissUnread();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismissUnread, isUnreadVisible]);

  return {
    unreadPosition,
    isUnreadVisible,
    dismissUnread,
  };
}
