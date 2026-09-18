"use client";

import type { ReactEventHandler, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const PLAYBACK_RECOVERY_GRACE_MS = 3000;

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
        // Hls.js media recovery is asynchronous. Give it time to emit
        // loadeddata/playing before treating the element error as terminal.
        if (videoRef.current === videoEl && videoEl.error !== null) {
          setErrorState({ failed: true, key: resetKey });
        }
      }, PLAYBACK_RECOVERY_GRACE_MS);
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
