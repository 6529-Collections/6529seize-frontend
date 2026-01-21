"use client";

import { useGlobalRefresh } from "@/contexts/RefreshContext";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";

const PULL_THRESHOLD = 80;
const PULL_MAX = 140;
const INDICATOR_SIZE = 36;

interface PullToRefreshProps {
  readonly triggerZoneRef: RefObject<HTMLElement | null>;
}

export default function PullToRefresh({ triggerZoneRef }: PullToRefreshProps) {
  const { invalidateAll } = useContext(ReactQueryWrapperContext);
  const { globalRefresh } = useGlobalRefresh();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const contentRef = useRef<HTMLElement | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  const getScrollableParent = useCallback(
    (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      const style = globalThis.getComputedStyle(element);
      const overflowY = style.overflowY;
      if (overflowY === "scroll" || overflowY === "auto") {
        if (element.scrollHeight > element.clientHeight) {
          return element;
        }
      }
      return getScrollableParent(element.parentElement);
    },
    []
  );

  const resetContentStyles = useCallback(() => {
    if (!contentRef.current) return;
    contentRef.current.style.transform = "";
    contentRef.current.style.transition = "";
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshingRef.current) return;

      const target = e.target as HTMLElement;
      const triggerZone = triggerZoneRef.current;
      if (!triggerZone || !triggerZone.contains(target)) {
        return;
      }

      if (!isAtTop()) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY.current = touch.clientY;

      isPulling.current = true;
      contentRef.current = document.body;
    },
    [isAtTop, triggerZoneRef]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || isRefreshingRef.current) return;

      const target = e.target as HTMLElement;
      const scrollableParent = getScrollableParent(target);
      const isScrolledInParent =
        scrollableParent && scrollableParent.scrollTop > 0;

      if (isScrolledInParent || !isAtTop()) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        resetContentStyles();
        return;
      }

      const touch = e.touches[0];
      if (!touch) return;

      const diff = touch.clientY - touchStartY.current;

      if (diff <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        resetContentStyles();
        return;
      }

      const resistance = 0.5;
      const distance = Math.min(diff * resistance, PULL_MAX);
      pullDistanceRef.current = distance;
      setPullDistance(distance);

      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${distance}px)`;
        contentRef.current.style.transition = "none";
      }

      if (distance > 10) {
        e.preventDefault();
      }
    },
    [isAtTop, getScrollableParent, resetContentStyles]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);

      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${INDICATOR_SIZE + 20}px)`;
        contentRef.current.style.transition = "transform 0.3s ease-out";
      }
      pullDistanceRef.current = INDICATOR_SIZE + 20;
      setPullDistance(INDICATOR_SIZE + 20);

      invalidateAll();
      globalRefresh();

      refreshTimeoutRef.current = setTimeout(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        pullDistanceRef.current = 0;
        setPullDistance(0);
        if (contentRef.current) {
          contentRef.current.style.transform = "";
          contentRef.current.style.transition = "transform 0.3s ease-out";
        }
        refreshTimeoutRef.current = null;
      }, 1000);
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      if (contentRef.current) {
        contentRef.current.style.transform = "";
        contentRef.current.style.transition = "transform 0.3s ease-out";
      }
    }
  }, [invalidateAll, globalRefresh]);

  const handleTouchCancel = useCallback(() => {
    isPulling.current = false;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    isRefreshingRef.current = false;
    setIsRefreshing(false);
    pullDistanceRef.current = 0;
    setPullDistance(0);

    if (contentRef.current) {
      contentRef.current.style.transform = "";
      contentRef.current.style.transition = "";
    }
  }, []);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, {
      passive: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (contentRef.current) {
        contentRef.current.style.transform = "";
        contentRef.current.style.transition = "";
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  if (pullDistance === 0) return null;

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;
  const rotation = progress * 180;

  return (
    <div
      className="tw-fixed tw-left-0 tw-right-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center"
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(pullDistance - INDICATOR_SIZE - 8, 0)}px)`,
        opacity: Math.min(progress * 1.5, 1),
        transition: isPulling.current ? "none" : "all 0.3s ease-out",
      }}
    >
      <div
        className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-950 tw-shadow-xl"
        style={{
          width: INDICATOR_SIZE,
          height: INDICATOR_SIZE,
          transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
        }}
      >
        {isRefreshing ? (
          <svg
            className="tw-animate-spin"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="31.4 31.4"
              strokeDashoffset="10"
            />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={shouldTrigger ? "#3b82f6" : "#6b7280"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}
