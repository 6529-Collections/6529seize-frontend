"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMobileAppActivity } from "@/hooks/useMobileAppActivity";
import { useElementInView } from "./SeizeVideoPlayer.config";

interface ChatPlayback {
  readonly claim: (video: HTMLVideoElement) => void;
  readonly isCurrent: (video: HTMLVideoElement) => boolean;
  readonly release: (video: HTMLVideoElement) => void;
}

const ChatPlaybackContext = createContext<ChatPlayback | null>(null);

/** Only the Wave/DM message list opts into this policy. */
export function ChatVideoPlaybackProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [playback] = useState<ChatPlayback>(() => {
    let active: HTMLVideoElement | null = null;
    return {
      claim(video) {
        if (active !== video) active?.pause();
        active = video;
      },
      isCurrent: (video) => active === video,
      release(video) {
        if (active === video) active = null;
      },
    };
  });
  return (
    <ChatPlaybackContext.Provider value={playback}>
      {children}
    </ChatPlaybackContext.Provider>
  );
}

function isFullscreen(video: HTMLVideoElement) {
  return (
    (video as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean })
      .webkitDisplayingFullscreen === true ||
    (document.fullscreenElement?.contains(video) ?? false)
  );
}

/** Keep playback sources closed until Play; never resume from visibility alone. */
export function useChatVideoPlayback(source: string) {
  const playback = useContext(ChatPlaybackContext);
  const [selection, setSelection] = useState<{
    source: string;
    playableUrl: string;
    isHls: boolean;
  } | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pendingPlayRef = useRef<HTMLVideoElement | null>(null);
  const isActive = useMobileAppActivity();
  const inView = useElementInView(playback ? video : null);
  const setVideoElement = useCallback(
    (element: HTMLVideoElement | null) => {
      const previous = videoRef.current;
      if (previous && previous !== element) playback?.release(previous);
      pendingPlayRef.current = null;
      videoRef.current = element;
      setVideo(element);
    },
    [playback]
  );
  const requestPlayback = useCallback(
    (rendition: { playableUrl: string; isHls: boolean }) => {
      setSelection((previous) =>
        previous?.source === source ? previous : { source, ...rendition }
      );
      if (videoRef.current) {
        pendingPlayRef.current = videoRef.current;
        playback?.claim(videoRef.current);
      }
    },
    [playback, source]
  );

  const synchronizeVisibility = useCallback(() => {
    if (
      playback &&
      video &&
      (!isActive ||
        document.visibilityState === "hidden" ||
        (!inView && !isFullscreen(video)))
    ) {
      pendingPlayRef.current = null;
      video.pause();
    }
  }, [playback, video, isActive, inView]);

  useEffect(() => {
    if (!playback || !video) return;
    const pauseIfHidden = () => {
      if (document.visibilityState === "hidden") {
        pendingPlayRef.current = null;
        video.pause();
      }
    };
    const onPlay = () => {
      pendingPlayRef.current = null;
      if (
        document.visibilityState === "hidden" ||
        !isActive ||
        (!inView && !isFullscreen(video))
      ) {
        video.pause();
        return;
      }
      playback.claim(video);
    };
    const onFullscreenEnd = () => {
      if (!inView && !isFullscreen(video)) {
        pendingPlayRef.current = null;
        video.pause();
      }
    };
    const finishRequestedPlayback = () => {
      if (pendingPlayRef.current !== video || !playback.isCurrent(video))
        return;
      pendingPlayRef.current = null;
      if (
        isActive &&
        document.visibilityState !== "hidden" &&
        (inView || isFullscreen(video))
      ) {
        // HLS attaches asynchronously. Complete only the explicit Play request,
        // never a visibility-driven resume or a request superseded by another video.
        void video.play().catch(() => undefined);
      }
    };
    video.addEventListener("loadedmetadata", finishRequestedPlayback);
    video.addEventListener("play", onPlay);
    video.addEventListener("webkitendfullscreen", onFullscreenEnd);
    document.addEventListener("visibilitychange", pauseIfHidden);
    document.addEventListener("fullscreenchange", onFullscreenEnd);
    synchronizeVisibility();
    return () => {
      video.removeEventListener("loadedmetadata", finishRequestedPlayback);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("webkitendfullscreen", onFullscreenEnd);
      document.removeEventListener("visibilitychange", pauseIfHidden);
      document.removeEventListener("fullscreenchange", onFullscreenEnd);
    };
  }, [playback, video, isActive, inView, synchronizeVisibility]);

  return {
    isChat: playback !== null,
    requested: selection?.source === source,
    rendition: selection?.source === source ? selection : null,
    requestPlayback,
    setVideoElement,
  };
}
