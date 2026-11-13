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
  const [position, setPosition] = useState<{
    serialNo: number;
    direction: "above" | "below";
  } | null>(null);
  const dismissUnread = useCallback(() => {
    if (unreadDividerSerialNo === null) return;
    setPosition(null);
    onDismissUnread();
  }, [onDismissUnread, unreadDividerSerialNo]);
  const autoDismissUnread = useEffectEvent(onDismissUnread);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (
      !scrollContainer ||
      unreadDividerSerialNo === null ||
      !Number.isSafeInteger(unreadDividerSerialNo)
    ) {
      return;
    }

    const serialNo = unreadDividerSerialNo;
    const selector = `[data-unread-divider="${serialNo}"]`;
    let observedDivider: Element | null = null;
    let visibleTimer: ReturnType<typeof setTimeout> | undefined;
    let hasSeenDivider = false;
    let hasAutoDismissed = false;

    function cancelVisibilityTimer() {
      clearTimeout(visibleTimer);
      visibleTimer = undefined;
    }

    function observeDivider(divider: Element | null) {
      if (divider === observedDivider) return;
      cancelVisibilityTimer();
      hasSeenDivider = false;
      if (observedDivider) intersectionObserver?.unobserve(observedDivider);
      if (divider) intersectionObserver?.observe(divider);
      observedDivider = divider;
    }

    function showJump(direction: "above" | "below") {
      setPosition((current) =>
        current?.serialNo === serialNo && current.direction === direction
          ? current
          : { serialNo, direction }
      );
    }

    function checkUnreadVisibility() {
      if (hasAutoDismissed || !scrollContainer) return;

      const divider = scrollContainer.querySelector(selector);
      observeDivider(divider);

      if (document.visibilityState !== "visible") {
        cancelVisibilityTimer();
        return;
      }

      if (!divider) {
        if (!hasSeenDivider) showJump("above");
        return;
      }

      const viewport = scrollContainer.getBoundingClientRect();
      const rect = divider.getBoundingClientRect();
      if (rect.height <= 0 || viewport.height <= 0) {
        cancelVisibilityTimer();
        return;
      }

      if (hasSeenDivider) {
        if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) {
          hasAutoDismissed = true;
          autoDismissUnread();
        }
        return;
      }

      if (rect.top < viewport.top || rect.bottom > viewport.bottom) {
        cancelVisibilityTimer();
        showJump(rect.top < viewport.top ? "above" : "below");
        return;
      }

      // Chat can briefly move the divider into view while rows load or resize.
      // Keep the jump available until the same divider stays fully visible.
      visibleTimer ??= setTimeout(() => {
        visibleTimer = undefined;
        if (
          document.visibilityState !== "visible" ||
          !scrollContainer.contains(divider)
        ) {
          return;
        }
        const current = divider.getBoundingClientRect();
        const bounds = scrollContainer.getBoundingClientRect();
        if (
          current.height > 0 &&
          current.top >= bounds.top &&
          current.bottom <= bounds.bottom
        ) {
          hasSeenDivider = true;
          setPosition(null);
        }
      }, DIVIDER_VISIBLE_MS);
    }

    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(checkUnreadVisibility, {
            root: scrollContainer,
            threshold: [0, 1],
          });
    const observer = new MutationObserver(checkUnreadVisibility);
    observer.observe(scrollContainer, { childList: true, subtree: true });
    scrollContainer.addEventListener("scroll", checkUnreadVisibility, {
      passive: true,
    });
    document.addEventListener("visibilitychange", checkUnreadVisibility);
    checkUnreadVisibility();

    return () => {
      cancelVisibilityTimer();
      scrollContainer.removeEventListener("scroll", checkUnreadVisibility);
      document.removeEventListener("visibilitychange", checkUnreadVisibility);
      intersectionObserver?.disconnect();
      observer.disconnect();
    };
  }, [unreadDividerSerialNo, scrollContainerRef]);

  const unreadPosition: UnreadPosition =
    position?.serialNo === unreadDividerSerialNo
      ? position.direction
      : "hidden";
  const isUnreadVisible = unreadPosition !== "hidden";

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
