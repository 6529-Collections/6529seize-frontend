"use client";

import {
  MOBILE_BOTTOM_NAV_DOCK_SELECTOR,
  MOBILE_BOTTOM_NAV_ROOT_SELECTOR,
} from "@/helpers/navigation.helpers";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";

const DEFAULT_DOCK_GAP_PX = 4;
const COMPACT_DOCK_HEIGHT_PX = 54;
const EXPANDED_DOCK_HEIGHT_PX = 64;
const COMPACT_OVERLAY_SCALE = 0.88;

interface UseMeasuredMobileBottomNavDockBottomOptions {
  readonly enabled: boolean;
  readonly fallbackBottom: string;
  readonly measurementWindowMs: number;
  readonly fallbackScale?: string | undefined;
  readonly targetProperty?: "bottom" | `--${string}`;
  readonly targetScaleProperty?: `--${string}` | undefined;
  readonly dockGapPx?: number | undefined;
  readonly resetOnDisabled?: boolean | undefined;
}

interface MeasuredDockStyle {
  readonly bottom: string | null;
  readonly scale: string | null;
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

const clamp = ({
  max,
  min,
  value,
}: {
  readonly max: number;
  readonly min: number;
  readonly value: number;
}): number => Math.min(max, Math.max(min, value));

const formatScale = (scale: number): string =>
  Number(scale.toFixed(3)).toString();

const getMeasuredDockScale = (dockHeight: number): string => {
  const expandedProgress = clamp({
    max: 1,
    min: 0,
    value:
      (dockHeight - COMPACT_DOCK_HEIGHT_PX) /
      (EXPANDED_DOCK_HEIGHT_PX - COMPACT_DOCK_HEIGHT_PX),
  });
  const scale =
    COMPACT_OVERLAY_SCALE + (1 - COMPACT_OVERLAY_SCALE) * expandedProgress;

  return formatScale(scale);
};

const getMeasuredDockStyle = ({
  dockElement,
  dockGapPx,
}: {
  readonly dockElement: HTMLElement;
  readonly dockGapPx: number;
}): MeasuredDockStyle => {
  const rect = dockElement.getBoundingClientRect();
  const viewportHeight = getViewportHeight();

  if (
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.height) ||
    rect.height <= 0 ||
    viewportHeight <= 0 ||
    rect.top >= viewportHeight
  ) {
    return { bottom: null, scale: null };
  }

  const bottom = viewportHeight - rect.top + dockGapPx;
  if (bottom <= 0) {
    return { bottom: null, scale: null };
  }

  return {
    bottom: `${Math.round(bottom)}px`,
    scale: getMeasuredDockScale(rect.height),
  };
};

export const useMeasuredMobileBottomNavDockBottom = ({
  dockGapPx = DEFAULT_DOCK_GAP_PX,
  enabled,
  fallbackBottom,
  fallbackScale = "1",
  measurementWindowMs,
  resetOnDisabled = true,
  targetProperty = "bottom",
  targetScaleProperty,
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

    const applyScale = (nextScale: string | null) => {
      if (!targetScaleProperty) {
        return;
      }

      const targetElement = targetElementRef.current;
      if (!targetElement) {
        return;
      }

      const scale = nextScale ?? fallbackScale;
      if (targetElement.style.getPropertyValue(targetScaleProperty) === scale) {
        return;
      }

      targetElement.style.setProperty(targetScaleProperty, scale);
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

    const resetScale = () => {
      const targetElement = targetElementRef.current;
      if (!targetElement || !targetScaleProperty) {
        return;
      }

      targetElement.style.removeProperty(targetScaleProperty);
    };

    if (!enabled || globalThis.document === undefined) {
      if (!resetOnDisabled) {
        return;
      }

      resetBottom();
      resetScale();
      return;
    }

    let dockElement: HTMLElement | null = null;
    let animationFrameId: number | null = null;
    let transitionTrackingUntil = 0;
    let resizeObserver: ResizeObserver | null = null;
    let dockRootObserver: MutationObserver | null = null;
    let dockRootPresenceObserver: MutationObserver | null = null;
    let dockRootParentObserver: MutationObserver | null = null;
    let dockRootElement: HTMLElement | null = null;
    let cancelled = false;

    const getDockRootElement = (): HTMLElement | null =>
      globalThis.document.querySelector<HTMLElement>(
        MOBILE_BOTTOM_NAV_ROOT_SELECTOR
      );

    const getLiveDockElement = (): HTMLElement | null =>
      globalThis.document.querySelector<HTMLElement>(
        MOBILE_BOTTOM_NAV_DOCK_SELECTOR
      );

    const getDockRootPresenceTarget = (): HTMLElement | null =>
      globalThis.document.body ?? globalThis.document.documentElement ?? null;

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
        applyScale(null);
        return;
      }

      const measuredStyle = getMeasuredDockStyle({ dockElement, dockGapPx });
      applyBottom(measuredStyle.bottom);
      applyScale(measuredStyle.scale);
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
      if (typeof MutationObserver === "undefined") {
        return;
      }

      const nextDockRootElement = getDockRootElement();
      if (dockRootElement === nextDockRootElement && dockRootObserver) {
        return;
      }

      dockRootObserver?.disconnect();
      dockRootParentObserver?.disconnect();
      dockRootObserver = null;
      dockRootParentObserver = null;
      dockRootElement = nextDockRootElement;

      if (!dockRootElement) {
        observeDockRootPresence();
        return;
      }

      dockRootPresenceObserver?.disconnect();
      dockRootPresenceObserver = null;
      dockRootObserver = new MutationObserver(scheduleMeasurement);
      dockRootObserver.observe(dockRootElement, { childList: true });

      const dockRootParentElement = dockRootElement.parentElement;
      if (dockRootParentElement) {
        dockRootParentObserver = new MutationObserver(() => {
          observeDockRoot();
          scheduleMeasurement();
        });
        dockRootParentObserver.observe(dockRootParentElement, {
          childList: true,
        });
      }

      scheduleMeasurement();
    };

    const observeDockRootPresence = () => {
      if (typeof MutationObserver === "undefined" || dockRootPresenceObserver) {
        return;
      }

      const presenceTarget = getDockRootPresenceTarget();
      if (!presenceTarget) {
        return;
      }

      dockRootPresenceObserver = new MutationObserver(() => {
        observeDockRoot();
        scheduleMeasurement();
      });
      dockRootPresenceObserver.observe(presenceTarget, {
        childList: true,
        subtree: true,
      });
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
      dockRootPresenceObserver?.disconnect();
      dockRootParentObserver?.disconnect();
      resizeObserver?.disconnect();
      removeDockListeners();
      resetBottom();
      resetScale();
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
    fallbackScale,
    measurementWindowMs,
    resetOnDisabled,
    targetProperty,
    targetScaleProperty,
  ]);

  return targetElementRef;
};
