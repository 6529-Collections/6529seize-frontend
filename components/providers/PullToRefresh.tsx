"use client";

import { useGlobalRefresh } from "@/contexts/RefreshContext";
import {
  PULL_TO_REFRESH_ACTIVE_ATTRIBUTE,
  PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY,
  PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY,
} from "@/helpers/pull-to-refresh.helpers";
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
const RELEASE_TRANSITION = "transform 0.3s ease-out";
const RELEASE_TRANSITION_DURATION_MS = 300;

interface PullToRefreshProps {
  readonly triggerZoneRef: RefObject<HTMLElement | null>;
  readonly contentRef?: RefObject<HTMLElement | null>;
}

const useFixedOverlayPullOffset = () => {
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimeout = useCallback(() => {
    if (!resetTimeoutRef.current) {
      return;
    }

    clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = null;
  }, []);

  useEffect(() => clearResetTimeout, [clearResetTimeout]);

  return useCallback(
    (distance: number, transitionDurationMs: number) => {
      clearResetTimeout();

      const documentElement = document.documentElement;
      const hasActiveOverlayOffset =
        distance !== 0 || transitionDurationMs !== 0;

      if (hasActiveOverlayOffset) {
        documentElement.setAttribute(PULL_TO_REFRESH_ACTIVE_ATTRIBUTE, "true");
      } else {
        documentElement.removeAttribute(PULL_TO_REFRESH_ACTIVE_ATTRIBUTE);
      }

      documentElement.style.setProperty(
        PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY,
        `${transitionDurationMs}ms`
      );
      documentElement.style.setProperty(
        PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY,
        `${distance}px`
      );

      if (distance === 0 && transitionDurationMs > 0) {
        resetTimeoutRef.current = setTimeout(() => {
          document.documentElement.removeAttribute(
            PULL_TO_REFRESH_ACTIVE_ATTRIBUTE
          );
          resetTimeoutRef.current = null;
        }, transitionDurationMs);
      }
    },
    [clearResetTimeout]
  );
};

export default function PullToRefresh({
  contentRef: providedContentRef,
  triggerZoneRef,
}: PullToRefreshProps) {
  const { invalidateAll } = useContext(ReactQueryWrapperContext);
  const { globalRefresh } = useGlobalRefresh();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const transformedContentRef = useRef<HTMLElement | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const setFixedOverlayPullOffset = useFixedOverlayPullOffset();

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
    if (transformedContentRef.current) {
      transformedContentRef.current.style.transform = "";
      transformedContentRef.current.style.transition = "";
    }
    setFixedOverlayPullOffset(0, 0);
  }, [setFixedOverlayPullOffset]);

  const releaseContentToOffset = useCallback(
    (distance: number) => {
      if (transformedContentRef.current) {
        transformedContentRef.current.style.transform =
          distance === 0 ? "" : `translateY(${distance}px)`;
        transformedContentRef.current.style.transition = RELEASE_TRANSITION;
      }

      setFixedOverlayPullOffset(distance, RELEASE_TRANSITION_DURATION_MS);
    },
    [setFixedOverlayPullOffset]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshingRef.current) return;

      const target = e.target as HTMLElement;
      const triggerZone = triggerZoneRef.current;
      if (!triggerZone?.contains(target)) {
        return;
      }

      if (!isAtTop()) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY.current = touch.clientY;

      isPulling.current = true;
      transformedContentRef.current =
        providedContentRef?.current ?? document.body;
      setFixedOverlayPullOffset(0, 0);
    },
    [isAtTop, providedContentRef, setFixedOverlayPullOffset, triggerZoneRef]
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
      setFixedOverlayPullOffset(distance, 0);

      if (transformedContentRef.current) {
        transformedContentRef.current.style.transform = `translateY(${distance}px)`;
        transformedContentRef.current.style.transition = "none";
      }

      if (distance > 10) {
        e.preventDefault();
      }
    },
    [
      isAtTop,
      getScrollableParent,
      resetContentStyles,
      setFixedOverlayPullOffset,
    ]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);

      const refreshingPullDistance = INDICATOR_SIZE + 20;
      releaseContentToOffset(refreshingPullDistance);
      pullDistanceRef.current = refreshingPullDistance;
      setPullDistance(refreshingPullDistance);

      invalidateAll();
      globalRefresh();

      refreshTimeoutRef.current = setTimeout(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        pullDistanceRef.current = 0;
        setPullDistance(0);
        releaseContentToOffset(0);
        refreshTimeoutRef.current = null;
      }, 1000);
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      releaseContentToOffset(0);
    }
  }, [invalidateAll, globalRefresh, releaseContentToOffset]);

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

    if (transformedContentRef.current) {
      transformedContentRef.current.style.transform = "";
      transformedContentRef.current.style.transition = "";
    }
    setFixedOverlayPullOffset(0, 0);
  }, [setFixedOverlayPullOffset]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    // react-doctor-disable-next-line react-doctor/client-passive-event-listeners pull-to-refresh must call preventDefault after the gesture commits.
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
      if (transformedContentRef.current) {
        transformedContentRef.current.style.transform = "";
        transformedContentRef.current.style.transition = "";
      }
      setFixedOverlayPullOffset(0, 0);
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    setFixedOverlayPullOffset,
  ]);

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
