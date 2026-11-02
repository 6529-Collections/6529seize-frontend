"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  restoreVideoSource,
  suspendVideoSource,
  type SuspendedVideoSource,
} from "@/services/media/video-loading";

const subscribeNoop = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface VideoLoadingOptions {
  readonly directSrc: string | undefined;
  readonly videoElement: HTMLVideoElement | null;
  readonly isMobileEnvironment: boolean;
  readonly isAppActive: boolean;
  readonly isInView: boolean;
  readonly isAnyFullscreen: boolean;
  readonly openedSource: string | undefined;
  readonly poster: string | undefined;
  readonly isPosterGateClosed: boolean;
  readonly autoPlay: boolean;
  readonly preload: "auto" | "metadata" | "none";
}

/** Pause loading without replacing the element or forgetting its playback position. */
export function useVideoLoading({
  directSrc,
  videoElement,
  isMobileEnvironment,
  isAppActive,
  isInView,
  isAnyFullscreen,
  openedSource,
  poster,
  isPosterGateClosed,
  autoPlay,
  preload,
}: VideoLoadingOptions) {
  // SSR cannot identify the mobile shell. Attach sources after hydration so
  // mobile visibility policy applies before the browser can start a request.
  const isHydrated = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot
  );
  const suspendedSourceRef = useRef<{
    source: string;
    value: SuspendedVideoSource;
  } | null>(null);
  const canLoadDirectSource =
    isAppActive && (!isMobileEnvironment || isInView || isAnyFullscreen);
  const deferPosterSource =
    Boolean(poster) &&
    (isPosterGateClosed ||
      (autoPlay &&
        !isInView &&
        !isAnyFullscreen &&
        openedSource !== directSrc));
  // preload is only a hint. Withhold never-opened mobile sources until needed.
  // Keep opened sources stable in React so suspension can capture their position.
  const deferMobileSource =
    isMobileEnvironment && !canLoadDirectSource && openedSource !== directSrc;
  const renderedSrc =
    !isHydrated || deferPosterSource || deferMobileSource
      ? undefined
      : directSrc;
  const videoPreload =
    !isHydrated ||
    !isAppActive ||
    (isMobileEnvironment && (!canLoadDirectSource || (poster && !autoPlay))) ||
    (poster && isPosterGateClosed)
      ? "none"
      : preload;

  useEffect(() => {
    if (!isMobileEnvironment || !videoElement || !directSrc) return;
    let removeRestoreListener: (() => void) | undefined;
    if (suspendedSourceRef.current?.source !== directSrc)
      suspendedSourceRef.current = null;
    if (!canLoadDirectSource) {
      const suspended = suspendVideoSource(videoElement);
      if (suspended)
        suspendedSourceRef.current = { source: directSrc, value: suspended };
    } else {
      const suspended = suspendedSourceRef.current;
      if (suspended) {
        suspendedSourceRef.current = null;
        removeRestoreListener = restoreVideoSource(
          videoElement,
          suspended.value
        );
      }
    }
    return () => removeRestoreListener?.();
  }, [
    canLoadDirectSource,
    directSrc,
    isMobileEnvironment,
    renderedSrc,
    videoElement,
  ]);

  return { canLoadDirectSource, renderedSrc, videoPreload };
}
