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
  const attachedIdentity = useRef<{
    video: HTMLVideoElement;
    key: string;
  } | null>(null);

  const remember = useCallback(
    (
      element: HTMLVideoElement,
      userControlled = false,
      capturePreferences = true
    ) => {
      const previous = memory.get(key);
      const hasPosition =
        pendingPosition.current === null &&
        element.readyState >= 1 &&
        Number.isFinite(element.currentTime);
      memory.set(key, {
        currentTime: hasPosition
          ? element.currentTime
          : (previous?.currentTime ?? 0),
        muted: capturePreferences
          ? element.muted
          : (previous?.muted ?? element.muted),
        volume: capturePreferences
          ? element.volume
          : (previous?.volume ?? element.volume),
        userControlled: userControlled || previous?.userControlled === true,
      });
    },
    [memory, key]
  );

  useLayoutEffect(() => {
    if (!video) return;
    const isReusedForAnotherVideo =
      attachedIdentity.current?.video === video &&
      attachedIdentity.current.key !== key;
    attachedIdentity.current = { video, key };
    const saved = memory.get(key);
    pendingPosition.current = saved?.currentTime ?? 0;
    if (saved) {
      restoreVideoPreferences(video, saved.muted, saved.volume);
    }
    const capture = () => remember(video);
    const emptied = () => {
      pendingPosition.current = memory.get(key)?.currentTime ?? null;
    };
    const restore = () => {
      const position = pendingPosition.current;
      if (position === null || video.readyState < 1) return;
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
    if (!isReusedForAnotherVideo) restore();
    return () => {
      // React may already have applied the next video's mute attribute.
      remember(video, false, false);
      captureEvents.forEach((event) =>
        video.removeEventListener(event, capture)
      );
      restoreEvents.forEach((event) =>
        video.removeEventListener(event, restore)
      );
      video.removeEventListener("emptied", emptied);
    };
  }, [video, memory, key, remember]);

  const rememberUserControl = useCallback(() => {
    if (video) remember(video, true);
  }, [video, remember]);
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
