"use client";

import type { ReactEventHandler, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useVideoPlaybackError({
  onRetry,
  resetKey,
  videoRef,
}: {
  readonly onRetry: () => void;
  readonly resetKey: string;
  readonly videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const errorCheckTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const [errorState, setErrorState] = useState<{
    readonly failed: boolean;
    readonly key: string;
  }>({ failed: false, key: resetKey });

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    const clearPlaybackError = () => {
      setErrorState({ failed: false, key: resetKey });
    };

    videoEl.addEventListener("loadeddata", clearPlaybackError);
    videoEl.addEventListener("playing", clearPlaybackError);

    return () => {
      videoEl.removeEventListener("loadeddata", clearPlaybackError);
      videoEl.removeEventListener("playing", clearPlaybackError);
      if (errorCheckTimeoutRef.current !== null) {
        globalThis.clearTimeout(errorCheckTimeoutRef.current);
        errorCheckTimeoutRef.current = null;
      }
    };
  }, [resetKey, videoRef]);

  const handlePlaybackError = useCallback<ReactEventHandler<HTMLVideoElement>>(
    (event) => {
      const videoEl = event.currentTarget;
      if (errorCheckTimeoutRef.current !== null) {
        globalThis.clearTimeout(errorCheckTimeoutRef.current);
      }
      errorCheckTimeoutRef.current = globalThis.setTimeout(() => {
        errorCheckTimeoutRef.current = null;
        // The HLS hook handles recoverable native-HLS errors synchronously.
        // Surface only a media element that remains failed afterward.
        if (videoRef.current === videoEl && videoEl.error !== null) {
          setErrorState({ failed: true, key: resetKey });
        }
      }, 0);
    },
    [resetKey, videoRef]
  );

  const retryPlayback = useCallback(() => {
    setErrorState({ failed: false, key: resetKey });
    onRetry();
  }, [onRetry, resetKey]);

  return {
    handlePlaybackError,
    hasPlaybackError: errorState.key === resetKey && errorState.failed,
    retryPlayback,
  };
}
