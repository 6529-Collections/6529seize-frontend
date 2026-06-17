"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Ref } from "react";

export type VideoLayout = "natural" | "fill" | "prominent";
export type VideoAlign = "left" | "center";
export type SeizeVideoMode = "inert-preview" | "ambient" | "interactive";
export type SeizeVideoControls = "none" | "minimal" | "native";
export type SeizeVideoTemplate =
  | "card-preview"
  | "ambient-media"
  | "watch-media"
  | "poster-gated"
  | "slideshow";

export interface ResolvedVideoTemplate {
  readonly mode: SeizeVideoMode;
  readonly controls: SeizeVideoControls;
  readonly autoPlay: boolean;
  readonly muted: boolean;
  readonly loop: boolean;
  readonly preload: "auto" | "metadata" | "none";
}

const DEFAULTS_BY_TEMPLATE: Record<SeizeVideoTemplate, ResolvedVideoTemplate> =
  {
    "card-preview": {
      mode: "inert-preview",
      controls: "none",
      autoPlay: false,
      muted: true,
      loop: true,
      preload: "metadata",
    },
    "ambient-media": {
      mode: "ambient",
      controls: "minimal",
      autoPlay: false,
      muted: true,
      loop: true,
      preload: "metadata",
    },
    "watch-media": {
      mode: "interactive",
      controls: "native",
      autoPlay: false,
      muted: false,
      loop: false,
      preload: "metadata",
    },
    "poster-gated": {
      mode: "interactive",
      controls: "native",
      autoPlay: false,
      muted: true,
      loop: false,
      preload: "metadata",
    },
    slideshow: {
      mode: "interactive",
      controls: "native",
      autoPlay: false,
      muted: false,
      loop: false,
      preload: "metadata",
    },
  };

export function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (!ref) {
    return;
  }
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeNoop = () => () => undefined;

export function resolveSeizeVideoTemplate({
  autoPlay,
  controls,
  loop,
  mode,
  muted,
  preload,
  template = "ambient-media",
}: {
  readonly autoPlay?: boolean | undefined;
  readonly controls?: SeizeVideoControls | undefined;
  readonly loop?: boolean | undefined;
  readonly mode?: SeizeVideoMode | undefined;
  readonly muted?: boolean | undefined;
  readonly preload?: "auto" | "metadata" | "none" | undefined;
  readonly template?: SeizeVideoTemplate | undefined;
}): ResolvedVideoTemplate {
  const defaults = DEFAULTS_BY_TEMPLATE[template];
  return {
    mode: mode ?? defaults.mode,
    controls: controls ?? defaults.controls,
    autoPlay: autoPlay ?? defaults.autoPlay,
    muted: muted ?? defaults.muted,
    loop: loop ?? defaults.loop,
    preload: preload ?? defaults.preload,
  };
}

function getPrefersReducedMotionSnapshot(): boolean {
  return (
    globalThis.window?.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false
  );
}

function subscribePrefersReducedMotion(onStoreChange: () => void) {
  const query = globalThis.window?.matchMedia?.(REDUCED_MOTION_QUERY);
  if (!query) {
    return () => undefined;
  }

  query.addEventListener("change", onStoreChange);
  return () => {
    query.removeEventListener("change", onStoreChange);
  };
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    () => false
  );
}

export function useElementInView(element: Element | null): boolean {
  const isInViewRef = useRef(false);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!element || typeof IntersectionObserver === "undefined") {
        isInViewRef.current = false;
        return subscribeNoop();
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          const nextIsInView = entry?.isIntersecting === true;
          if (isInViewRef.current === nextIsInView) {
            return;
          }
          isInViewRef.current = nextIsInView;
          onStoreChange();
        },
        { threshold: 0.1 }
      );
      observer.observe(element);
      return () => {
        observer.disconnect();
      };
    },
    [element]
  );

  const getSnapshot = useCallback(() => isInViewRef.current, []);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function getAspectRatio(
  width: number,
  height: number
): string | undefined {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return undefined;
  }
  if (width <= 0 || height <= 0) {
    return undefined;
  }
  return `${width} / ${height}`;
}

export function getOrientation(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return "unknown";
  }
  if (width > height * 1.08) {
    return "landscape";
  }
  if (height > width * 1.08) {
    return "portrait";
  }
  return "square";
}

export function getNaturalWidthClassName(
  orientation: string,
  layout: VideoLayout
) {
  if (layout === "fill") {
    return "tw-h-full tw-w-full";
  }

  if (layout === "prominent") {
    if (orientation === "portrait") {
      return "tw-w-[min(100%,34rem)]";
    }
    if (orientation === "square") {
      return "tw-w-[min(100%,42rem)]";
    }
    return "tw-w-full";
  }
  if (orientation === "portrait") {
    return "tw-w-[min(100%,24rem)]";
  }
  if (orientation === "square") {
    return "tw-w-[min(100%,32rem)]";
  }
  return "tw-w-full";
}
