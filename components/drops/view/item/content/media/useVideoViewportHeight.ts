"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  globalThis.window.addEventListener("resize", onChange);
  return () => globalThis.window.removeEventListener("resize", onChange);
}

const getClientSnapshot = () => globalThis.window.innerHeight;
// The server cannot know the viewport. React uses this snapshot while
// hydrating, so the first client render matches the server HTML, then it
// re-renders with the measured height.
const getServerSnapshot = (): number | undefined => undefined;

export function useVideoViewportHeight(): number | undefined {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
