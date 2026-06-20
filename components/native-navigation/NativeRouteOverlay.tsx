"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";

import useDeviceInfo from "@/hooks/useDeviceInfo";

const EDGE_SWIPE_WIDTH_PX = 36;
const EDGE_SWIPE_CLOSE_DISTANCE_PX = 72;
const EDGE_SWIPE_HORIZONTAL_RATIO = 1.35;

type SwipeSide = "left" | "right";

type GestureState = {
  readonly side: SwipeSide;
  readonly startX: number;
  readonly startY: number;
};

type TouchPoint = {
  readonly clientX: number;
  readonly clientY: number;
};

const getCanonicalCurrentPath = (): string =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

const getSameOriginAnchorPath = (anchor: HTMLAnchorElement): string | null => {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return null;
  }

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

export default function NativeRouteOverlay({
  children,
}: {
  readonly children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const [hasMounted, setHasMounted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const gestureRef = useRef<GestureState | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || isApp) {
      return;
    }

    window.location.replace(getCanonicalCurrentPath());
  }, [hasMounted, isApp]);

  const resetGesture = useCallback(() => {
    gestureRef.current = null;
    setDragX(0);
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch || event.touches.length !== 1) {
      return;
    }

    const viewportWidth = window.innerWidth || event.currentTarget.clientWidth;
    const side =
      touch.clientX <= EDGE_SWIPE_WIDTH_PX
        ? "left"
        : touch.clientX >= viewportWidth - EDGE_SWIPE_WIDTH_PX
          ? "right"
          : null;

    if (!side) {
      return;
    }

    gestureRef.current = {
      side,
      startX: touch.clientX,
      startY: touch.clientY,
    };
  }, []);

  const getInwardDrag = useCallback((touch: TouchPoint | undefined) => {
    const gesture = gestureRef.current;
    if (!gesture || !touch) {
      return null;
    }

    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const inwardDistance =
      gesture.side === "left" ? Math.max(deltaX, 0) : Math.max(-deltaX, 0);
    const signedDistance =
      gesture.side === "left" ? inwardDistance : -inwardDistance;

    return {
      deltaY,
      inwardDistance,
      signedDistance,
    };
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const drag = getInwardDrag(event.touches[0]);
      if (!drag) {
        return;
      }

      const absY = Math.abs(drag.deltaY);
      if (
        drag.inwardDistance <= 8 ||
        drag.inwardDistance <= absY * EDGE_SWIPE_HORIZONTAL_RATIO
      ) {
        return;
      }

      event.preventDefault();
      setIsDragging(true);
      setDragX(drag.signedDistance);
    },
    [getInwardDrag]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const drag = getInwardDrag(event.changedTouches[0]);
      if (!drag) {
        return;
      }

      const shouldClose =
        drag.inwardDistance >= EDGE_SWIPE_CLOSE_DISTANCE_PX &&
        drag.inwardDistance >
          Math.abs(drag.deltaY) * EDGE_SWIPE_HORIZONTAL_RATIO;

      resetGesture();

      if (shouldClose) {
        router.back();
      }
    },
    [getInwardDrag, resetGesture, router]
  );

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        event.button !== 0
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !event.currentTarget.contains(anchor)) {
        return;
      }

      if (
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const targetPath = getSameOriginAnchorPath(anchor);
      if (!targetPath || targetPath === getCanonicalCurrentPath()) {
        return;
      }

      event.preventDefault();
      router.replace(targetPath, { scroll: true });
    },
    [router]
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      transform: dragX === 0 ? undefined : `translate3d(${dragX}px, 0, 0)`,
      transition: isDragging ? "none" : "transform 180ms ease-out",
      touchAction: "pan-y",
    }),
    [dragX, isDragging]
  );

  if (!hasMounted || !isApp) {
    return null;
  }

  return (
    <div
      aria-label="Profile overlay"
      aria-modal="true"
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[2147483000] tw-overflow-hidden tw-bg-black"
      data-native-route-overlay={pathname}
      data-testid="native-route-overlay"
      onClickCapture={handleClickCapture}
      onTouchCancel={resetGesture}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      role="dialog"
    >
      <div
        className="tw-h-[100dvh] tw-overflow-y-auto tw-overscroll-contain tw-bg-black tw-text-iron-50"
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  );
}
