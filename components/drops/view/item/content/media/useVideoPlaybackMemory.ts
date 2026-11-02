"use client";

import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  VideoPlaybackMemoryContext,
  type VideoPlaybackSnapshot,
} from "./VideoPlaybackMemory";
import {
  restoreVideoPreferences,
  seekVideoPosition,
} from "@/services/media/video-loading";

/** Save before media teardown; restore only after the replacement is seekable. */
export function useVideoPlaybackMemory(
  video: HTMLVideoElement | null,
  identity: string | undefined
) {
  const sharedMemory = useContext(VideoPlaybackMemoryContext);
  const [localMemory] = useState(
    () => new Map<string, VideoPlaybackSnapshot>()
  );
  const memory = sharedMemory ?? localMemory;
  const key = identity ?? "";
  const pendingPosition = useRef<number | null>(null);
  const pendingPreferences = useRef<{
    muted: boolean;
    volume: number;
  } | null>(null);

  const remember = useCallback(
    (
      element: HTMLVideoElement,
      userControlled = false,
      capturePreferences = true
    ) => {
      const previous = memory.get(key);
      if (userControlled && capturePreferences && pendingPreferences.current) {
        pendingPreferences.current = {
          muted: element.muted,
          volume:
            element.readyState >= 1
              ? element.volume
              : pendingPreferences.current.volume,
        };
      }
      const preferences = pendingPreferences.current;
      const hasPosition =
        pendingPosition.current === null &&
        element.readyState >= 1 &&
        Number.isFinite(element.currentTime);
      const canCapturePreferences =
        capturePreferences && (hasPosition || userControlled);
      memory.set(key, {
        currentTime: hasPosition
          ? element.currentTime
          : (previous?.currentTime ?? 0),
        muted: canCapturePreferences
          ? (preferences?.muted ?? element.muted)
          : (previous?.muted ?? element.muted),
        volume: canCapturePreferences
          ? (preferences?.volume ?? element.volume)
          : (previous?.volume ?? element.volume),
        userControlled: userControlled || previous?.userControlled === true,
      });
    },
    [memory, key]
  );

  useLayoutEffect(() => {
    if (!sharedMemory) {
      // Keep a source's offscreen state locally, but start fresh after switching
      // sources outside a chat provider (for example, when a slideshow cycles).
      for (const storedKey of memory.keys()) {
        if (storedKey !== key) memory.delete(storedKey);
      }
    }
    // Callback-ref state may briefly still refer to the previous source's node.
    if (video?.dataset["playbackIdentity"] !== key) return;
    const saved = memory.get(key);
    pendingPosition.current = saved?.currentTime ?? 0;
    pendingPreferences.current = saved ?? null;
    if (saved) {
      restoreVideoPreferences(video, saved.muted, saved.volume);
    }
    const capture = () => remember(video);
    const emptied = () => {
      const snapshot = memory.get(key);
      pendingPosition.current = snapshot?.currentTime ?? null;
      pendingPreferences.current = snapshot ?? null;
    };
    const restore = () => {
      if (video.readyState < 1) return;
      const preferences = pendingPreferences.current;
      if (
        preferences &&
        restoreVideoPreferences(video, preferences.muted, preferences.volume)
      ) {
        pendingPreferences.current = null;
      }
      const position = pendingPosition.current;
      if (position === null) return;
      if (seekVideoPosition(video, position)) {
        pendingPosition.current = null;
        capture();
      }
    };
    const captureEvents = ["timeupdate", "seeked", "pause", "volumechange"];
    const restoreEvents = ["loadedmetadata", "loadeddata", "canplay"];
    captureEvents.forEach((event) => video.addEventListener(event, capture));
    restoreEvents.forEach((event) => video.addEventListener(event, restore));
    video.addEventListener("emptied", emptied);
    restore();
    return () => {
      // Media teardown may already have reset the element's preferences.
      remember(video, false, false);
      captureEvents.forEach((event) =>
        video.removeEventListener(event, capture)
      );
      restoreEvents.forEach((event) =>
        video.removeEventListener(event, restore)
      );
      video.removeEventListener("emptied", emptied);
    };
  }, [video, memory, key, remember, sharedMemory]);

  const rememberUserControl = useCallback(
    (capturePreferences = false) => {
      if (video) remember(video, true, capturePreferences);
    },
    [video, remember]
  );
  const isUserControlled = useCallback(
    () => memory.get(key)?.userControlled === true,
    [memory, key]
  );

  return {
    savedPlayback: memory.get(key),
    rememberUserControl,
    isUserControlled,
  };
}
