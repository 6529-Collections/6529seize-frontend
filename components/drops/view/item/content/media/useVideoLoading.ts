"use client";

import { useEffect, useRef } from "react";
import {
  restoreVideoSource,
  suspendVideoSource,
  type SuspendedVideoSource,
} from "@/services/media/video-loading";

interface VideoLoadingOptions {
  readonly directSrc: string | undefined;
  readonly videoElement: HTMLVideoElement | null;
  readonly isNative: boolean;
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
  isNative,
  isAppActive,
  isInView,
  isAnyFullscreen,
  openedSource,
  poster,
  isPosterGateClosed,
  autoPlay,
  preload,
}: VideoLoadingOptions) {
  const suspendedSourceRef = useRef<{
    source: string;
    value: SuspendedVideoSource;
  } | null>(null);
  const canLoadDirectSource =
    isAppActive && (!isNative || isInView || isAnyFullscreen);
  const deferPosterSource =
    Boolean(poster) &&
    (isPosterGateClosed ||
      (autoPlay &&
        !isInView &&
        !isAnyFullscreen &&
        openedSource !== directSrc));
  const renderedSrc = deferPosterSource ? undefined : directSrc;
  const videoPreload =
    !isAppActive ||
    (isNative && (!canLoadDirectSource || (poster && !autoPlay))) ||
    (poster && isPosterGateClosed)
      ? "none"
      : preload;

  useEffect(() => {
    if (!isNative || !videoElement || !directSrc) return;
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
  }, [canLoadDirectSource, directSrc, isNative, renderedSrc, videoElement]);

  return { canLoadDirectSource, renderedSrc, videoPreload };
}
