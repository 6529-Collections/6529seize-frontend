"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useEffectEvent, useState } from "react";

type UnreadPosition = "hidden" | "above" | "below";

const DIVIDER_VISIBLE_MS = 300;

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
  const dismissUnread = useCallback(() => {
    if (unreadDividerSerialNo === null) return;
    setUnreadPosition("hidden");
    onDismissUnread();
  }, [onDismissUnread, unreadDividerSerialNo]);
  const autoDismissUnread = useEffectEvent(onDismissUnread);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || unreadDividerSerialNo === null) {
      setUnreadPosition("hidden");
      return;
    }

    let observedDivider: Element | null = null;
    let visibleTimer: ReturnType<typeof setTimeout> | undefined;
    let hasSeenDivider = false;
    let hasAutoDismissed = false;

    function cancelVisibilityTimer() {
      clearTimeout(visibleTimer);
      visibleTimer = undefined;
    }

    function checkUnreadVisibility(confirmedDivider?: Element) {
      if (hasAutoDismissed || !scrollContainer) return;

      const divider = scrollContainer.querySelector(
        `[data-unread-divider="${unreadDividerSerialNo}"]`
      );
      if (divider !== observedDivider) {
        cancelVisibilityTimer();
        if (observedDivider) intersectionObserver?.unobserve(observedDivider);
        if (divider) intersectionObserver?.observe(divider);
        observedDivider = divider;
      }

      if (document.visibilityState !== "visible") {
        cancelVisibilityTimer();
        return;
      }

      if (!divider) {
        if (!hasSeenDivider) setUnreadPosition("above");
        return;
      }

      const viewport = scrollContainer.getBoundingClientRect();
      const rect = divider.getBoundingClientRect();
      const fullyVisible =
        rect.height > 0 &&
        rect.top >= viewport.top &&
        rect.bottom <= viewport.bottom;

      if (hasSeenDivider) {
        if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) {
          hasAutoDismissed = true;
          autoDismissUnread();
        }
        return;
      }

      if (!fullyVisible) {
        cancelVisibilityTimer();
        setUnreadPosition(rect.top < viewport.top ? "above" : "below");
        return;
      }

      // Chat can briefly move the divider into view while rows load or resize.
      // Keep the jump available until the same divider stays fully visible.
      if (divider === confirmedDivider) {
        hasSeenDivider = true;
        setUnreadPosition("hidden");
      } else {
        visibleTimer ??= setTimeout(() => {
          visibleTimer = undefined;
          checkUnreadVisibility(divider);
        }, DIVIDER_VISIBLE_MS);
      }
    }

    const check = () => {
      checkUnreadVisibility();
    };
    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(check, {
            root: scrollContainer,
            threshold: [0, 1],
          });
    const observer = new MutationObserver(check);
    observer.observe(scrollContainer, { childList: true, subtree: true });
    scrollContainer.addEventListener("scroll", check, { passive: true });
    document.addEventListener("visibilitychange", check);
    check();

    return () => {
      cancelVisibilityTimer();
      scrollContainer.removeEventListener("scroll", check);
      document.removeEventListener("visibilitychange", check);
      intersectionObserver?.disconnect();
      observer.disconnect();
    };
  }, [unreadDividerSerialNo, scrollContainerRef]);

  const isUnreadVisible =
    unreadPosition !== "hidden" && unreadDividerSerialNo !== null;

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
