"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
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
  `${globalThis.location.pathname}${globalThis.location.search}${globalThis.location.hash}`;

const getSameOriginAnchorPath = (anchor: HTMLAnchorElement): string | null => {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return null;
  }

  const url = new URL(href, globalThis.location.href);
  if (url.origin !== globalThis.location.origin) {
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
  const overlayRef = useRef<HTMLDialogElement | null>(null);
  const gestureRef = useRef<GestureState | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || isApp) {
      return;
    }

    const frameId = globalThis.requestAnimationFrame(() => {
      globalThis.location.replace(getCanonicalCurrentPath());
    });

    return () => {
      globalThis.cancelAnimationFrame(frameId);
    };
  }, [hasMounted, isApp]);

  useEffect(() => {
    if (!hasMounted || !isApp) {
      return;
    }

    overlayRef.current?.focus({ preventScroll: true });
  }, [hasMounted, isApp]);

  const resetGesture = useCallback(() => {
    gestureRef.current = null;
    setDragX(0);
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDialogElement>) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length !== 1) {
        return;
      }

      const viewportWidth =
        globalThis.innerWidth || event.currentTarget.clientWidth;
      let side: SwipeSide | null = null;
      if (touch.clientX <= EDGE_SWIPE_WIDTH_PX) {
        side = "left";
      } else if (touch.clientX >= viewportWidth - EDGE_SWIPE_WIDTH_PX) {
        side = "right";
      }

      if (!side) {
        return;
      }

      gestureRef.current = {
        side,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    },
    []
  );

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
    (event: TouchEvent<HTMLDialogElement>) => {
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
    (event: TouchEvent<HTMLDialogElement>) => {
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

  const closeOverlay = useCallback(() => {
    router.back();
  }, [router]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDialogElement>) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeOverlay();
    },
    [closeOverlay]
  );

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLDialogElement>) => {
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
    <dialog
      aria-label="Profile overlay"
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[2147483000] tw-m-0 tw-h-auto tw-max-h-none tw-w-auto tw-max-w-none tw-overflow-hidden tw-border-0 tw-bg-black tw-p-0"
      data-native-route-overlay={pathname}
      data-testid="native-route-overlay"
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
      onTouchCancel={resetGesture}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      open
      ref={overlayRef}
      tabIndex={-1}
    >
      <button className="tw-sr-only" onClick={closeOverlay} type="button">
        Close profile overlay
      </button>
      <div
        className="tw-h-[100dvh] tw-overflow-y-auto tw-overscroll-contain tw-bg-black tw-text-iron-50"
        style={contentStyle}
      >
        {children}
      </div>
    </dialog>
  );
}
