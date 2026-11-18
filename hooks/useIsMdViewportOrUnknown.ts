"use client";

import { useSyncExternalStore } from "react";

// Tailwind's `md` breakpoint.
const MD_VIEWPORT_QUERY = "(min-width: 768px)";

let mediaQueryList: MediaQueryList | null | undefined;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const getMediaQueryList = (): MediaQueryList | null => {
  if (mediaQueryList === undefined) {
    mediaQueryList =
      typeof globalThis.matchMedia === "function"
        ? globalThis.matchMedia(MD_VIEWPORT_QUERY)
        : null;
  }
  return mediaQueryList;
};

// One media-query listener serves every subscriber; chat mounts one per row.
const subscribe = (listener: () => void): (() => void) => {
  const list = getMediaQueryList();
  if (listeners.size === 0) {
    list?.addEventListener("change", notify);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      list?.removeEventListener("change", notify);
    }
  };
};

const getSnapshot = (): boolean | null => getMediaQueryList()?.matches ?? null;
const getServerSnapshot = (): null => null;

/**
 * Whether the viewport is at least Tailwind's `md` width, or null when that is
 * not known yet (server render, hydration, no `matchMedia`). Callers that pick
 * between a mobile-only and a desktop-only element should render both while it
 * is null and let CSS hide one, so server and client markup agree.
 */
export default function useIsMdViewportOrUnknown(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
