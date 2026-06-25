"use client";

import {
  MOBILE_BOTTOM_NAV_DOCK_SELECTOR,
  MOBILE_BOTTOM_NAV_ROOT_SELECTOR,
} from "@/helpers/navigation.helpers";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";

const DEFAULT_DOCK_GAP_PX = 4;

interface UseMeasuredMobileBottomNavDockBottomOptions {
  readonly enabled: boolean;
  readonly fallbackBottom: string;
  readonly measurementWindowMs: number;
  readonly targetProperty?: "bottom" | `--${string}`;
  readonly dockGapPx?: number | undefined;
  readonly resetOnDisabled?: boolean | undefined;
}

const getViewportHeight = (): number => {
  const viewportHeight = globalThis.visualViewport?.height;
  if (typeof viewportHeight === "number" && viewportHeight > 0) {
    return viewportHeight;
  }

  if (
    typeof globalThis.innerHeight === "number" &&
    globalThis.innerHeight > 0
  ) {
    return globalThis.innerHeight;
  }

  return globalThis.document?.documentElement?.clientHeight ?? 0;
};

const getMeasuredDockBottom = ({
  dockElement,
  dockGapPx,
}: {
  readonly dockElement: HTMLElement;
  readonly dockGapPx: number;
}): string | null => {
  const rect = dockElement.getBoundingClientRect();
  const viewportHeight = getViewportHeight();

  if (
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.height) ||
    rect.height <= 0 ||
    viewportHeight <= 0 ||
    rect.top >= viewportHeight
  ) {
    return null;
  }

  const bottom = viewportHeight - rect.top + dockGapPx;
  if (bottom <= 0) {
    return null;
  }

  return `${Math.round(bottom)}px`;
};

export const useMeasuredMobileBottomNavDockBottom = ({
  dockGapPx = DEFAULT_DOCK_GAP_PX,
  enabled,
  fallbackBottom,
  measurementWindowMs,
  resetOnDisabled = true,
  targetProperty = "bottom",
}: UseMeasuredMobileBottomNavDockBottomOptions): RefObject<HTMLDivElement | null> => {
  const targetElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyBottom = (nextBottom: string | null) => {
      const targetElement = targetElementRef.current;
      if (!targetElement) {
        return;
      }

      const bottom = nextBottom ?? fallbackBottom;
      if (targetProperty === "bottom") {
        if (targetElement.style.bottom === bottom) {
          return;
        }

        targetElement.style.bottom = bottom;
        return;
      }

      if (targetElement.style.getPropertyValue(targetProperty) === bottom) {
        return;
      }

      targetElement.style.setProperty(targetProperty, bottom);
    };

    const resetBottom = () => {
      const targetElement = targetElementRef.current;
      if (!targetElement) {
        return;
      }

      if (targetProperty === "bottom") {
        targetElement.style.removeProperty("bottom");
        return;
      }

      targetElement.style.removeProperty(targetProperty);
    };

    if (!enabled || globalThis.document === undefined) {
      if (!resetOnDisabled) {
        return;
      }

      resetBottom();
      return;
    }

    let dockElement: HTMLElement | null = null;
    let animationFrameId: number | null = null;
    let transitionTrackingUntil = 0;
    let resizeObserver: ResizeObserver | null = null;
    let dockRootObserver: MutationObserver | null = null;
    let cancelled = false;

    const getDockRootElement = (): HTMLElement | null =>
      globalThis.document.querySelector<HTMLElement>(
        MOBILE_BOTTOM_NAV_ROOT_SELECTOR
      );

    const getLiveDockElement = (): HTMLElement | null =>
      globalThis.document.querySelector<HTMLElement>(
        MOBILE_BOTTOM_NAV_DOCK_SELECTOR
      );

    const removeDockListeners = () => {
      dockElement?.removeEventListener("transitionrun", trackDockTransition);
      dockElement?.removeEventListener("transitionstart", trackDockTransition);
      dockElement?.removeEventListener("transitionend", updateMeasuredBottom);
    };

    const bindDockElement = (nextDockElement: HTMLElement | null) => {
      if (dockElement === nextDockElement) {
        return;
      }

      resizeObserver?.disconnect();
      resizeObserver = null;
      removeDockListeners();
      dockElement = nextDockElement;

      if (typeof ResizeObserver !== "undefined" && dockElement) {
        resizeObserver = new ResizeObserver(trackDockTransition);
        resizeObserver.observe(dockElement);
      }

      dockElement?.addEventListener("transitionrun", trackDockTransition);
      dockElement?.addEventListener("transitionstart", trackDockTransition);
      dockElement?.addEventListener("transitionend", updateMeasuredBottom);
    };

    const updateMeasuredBottom = () => {
      if (cancelled) {
        return;
      }

      const liveDockElement = getLiveDockElement();
      bindDockElement(liveDockElement);

      if (!dockElement) {
        applyBottom(null);
        return;
      }

      applyBottom(getMeasuredDockBottom({ dockElement, dockGapPx }));
    };

    const scheduleMeasurement = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = globalThis.requestAnimationFrame(() => {
        animationFrameId = null;
        updateMeasuredBottom();
      });
    };

    const trackDockTransition = () => {
      transitionTrackingUntil =
        globalThis.performance.now() + measurementWindowMs;

      const tick = () => {
        animationFrameId = null;
        updateMeasuredBottom();

        if (
          !cancelled &&
          globalThis.performance.now() < transitionTrackingUntil
        ) {
          animationFrameId = globalThis.requestAnimationFrame(tick);
        }
      };

      // A transition replaces any queued one-shot measurement with the full
      // transition loop so the overlay tracks every compact/expand frame.
      if (animationFrameId !== null) {
        globalThis.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = globalThis.requestAnimationFrame(tick);
    };

    const observeDockRoot = () => {
      dockRootObserver?.disconnect();
      dockRootObserver = null;

      const dockRootElement = getDockRootElement();
      if (typeof MutationObserver === "undefined" || !dockRootElement) {
        return;
      }

      dockRootObserver = new MutationObserver(scheduleMeasurement);
      dockRootObserver.observe(dockRootElement, { childList: true });
    };

    updateMeasuredBottom();
    globalThis.addEventListener("resize", trackDockTransition, {
      passive: true,
    });
    globalThis.visualViewport?.addEventListener("resize", trackDockTransition, {
      passive: true,
    });
    observeDockRoot();
    scheduleMeasurement();

    return () => {
      cancelled = true;
      if (animationFrameId !== null) {
        globalThis.cancelAnimationFrame(animationFrameId);
      }
      dockRootObserver?.disconnect();
      resizeObserver?.disconnect();
      removeDockListeners();
      resetBottom();
      globalThis.removeEventListener("resize", trackDockTransition);
      globalThis.visualViewport?.removeEventListener(
        "resize",
        trackDockTransition
      );
    };
  }, [
    dockGapPx,
    enabled,
    fallbackBottom,
    measurementWindowMs,
    resetOnDisabled,
    targetProperty,
  ]);

  return targetElementRef;
};
