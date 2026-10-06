"use client";

import { useMobileBatterySavings } from "@/hooks/useMobileAppActivity";
import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef } from "react";
import SeizeVideoPlayer from "./SeizeVideoPlayer";
import { assignRef, usePrefersReducedMotion } from "./SeizeVideoPlayer.config";
import VideoPlaybackErrorOverlay from "./VideoPlaybackErrorOverlay";
import { useVideoPlaybackError } from "./useVideoPlaybackError";
import { useMediaActions } from "./useMediaActions";
import type { MediaLoadStrategy } from "./mediaLoadStrategy";
import { useChatVideoPlayback } from "./ChatVideoPlayback";
import { useRememberedVideoPlayback } from "./VideoPlaybackMemory";

interface Props {
  readonly src: string;
  readonly mimeType?: string | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly artworkLayout?: boolean | undefined;
  readonly allowAutoPlayInApp?: boolean | undefined;
  readonly fillContainer?: boolean | undefined;
  readonly align?: "left" | "center" | undefined;
  readonly showFullscreen?: boolean | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
}

function DropListItemContentMediaVideo({
  src,
  mimeType,
  disableAutoPlay = false,
  allowAutoPlayInApp = false,
  fillContainer = false,
  artworkLayout = false,
  align = "left",
  showFullscreen = true,
  loadStrategy = "in-view",
}: Props) {
  const { isApp } = useDeviceInfo();
  const isMobileEnvironment = useMobileBatterySavings();
  const [wrapperRef, inView] = useInView<HTMLDivElement>({
    freezeOnceVisible: false,
    rootMargin: isMobileEnvironment ? "0px" : "400px 0px",
    threshold: 0.1,
  });
  const wasFullscreenRef = useRef(false);
  const locale = useBrowserLocale();
  const prefersReducedMotion = usePrefersReducedMotion();
  const chat = useChatVideoPlayback(src);
  const savedPlayback = useRememberedVideoPlayback(src);
  const shouldLoadVideo =
    (loadStrategy === "eager" || inView) && (!chat.isChat || chat.requested);
  const canAutoPlayInCurrentEnvironment = allowAutoPlayInApp
    ? !prefersReducedMotion
    : !isApp;
  const shouldAutoPlay =
    inView &&
    !chat.isChat &&
    !disableAutoPlay &&
    canAutoPlayInCurrentEnvironment &&
    !savedPlayback?.userControlled;
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "video",
      dialogTitle: "Save video",
      mimeType,
    });

  // 1) Pick up the best URL (HLS or MP4)
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    enabled:
      (loadStrategy === "eager" || inView) && (!chat.isChat || !chat.requested),
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // 2) Setup HLS (or native) once and get back the videoRef + loading state
  const {
    videoRef,
    retry,
    isFullscreen: isVideoFullscreen,
  } = useHlsPlayer({
    enabled: shouldLoadVideo,
    bufferingEnabled: inView,
    src: chat.rendition?.playableUrl ?? playableUrl,
    isHls: chat.rendition?.isHls ?? isHls,
    fallbackSrc: src,
    autoPlay: shouldAutoPlay,
  });

  // The shared player owns autoplay and user mute/pause preferences.
  const { setVideoElement } = chat;
  const setVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      assignRef(videoRef, element);
      setVideoElement(element);
    },
    [videoRef, setVideoElement]
  );

  const { handlePlaybackError, hasPlaybackError, retryPlayback } =
    useVideoPlaybackError({
      onRetry: retry,
      resetKey: playableUrl,
      videoRef,
    });

  // 4) Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.setAttribute("webkit-playsinline", "true");
    videoEl.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  useEffect(() => {
    if (!isApp) {
      return;
    }

    const pauseWhenFullscreenCloses = () => {
      const videoEl = videoRef.current;
      if (!videoEl) {
        return;
      }

      const fullscreenElement = document.fullscreenElement;
      if (
        isVideoFullscreen ||
        (fullscreenElement?.contains(videoEl) ?? false)
      ) {
        wasFullscreenRef.current = true;
        return;
      }

      if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        videoEl.pause();
      }
    };

    pauseWhenFullscreenCloses();
    document.addEventListener("fullscreenchange", pauseWhenFullscreenCloses);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        pauseWhenFullscreenCloses
      );
    };
  }, [isApp, isVideoFullscreen, videoRef]);

  const videoLayout = artworkLayout ? "artwork" : "natural";

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "tw-relative tw-flex tw-w-full tw-items-start tw-justify-start",
        artworkLayout && "lg:tw-h-full",
        fillContainer && "tw-h-full tw-max-h-full"
      )}
    >
      <SeizeVideoPlayer
        videoRef={setVideoRef}
        onPlaybackRequest={
          chat.isChat
            ? () => chat.requestPlayback({ playableUrl, isHls })
            : undefined
        }
        preload={chat.isChat && !chat.requested ? "none" : undefined}
        data-url={src}
        template="ambient-media"
        autoPlay={shouldAutoPlay}
        layout={fillContainer ? "fill" : videoLayout}
        align={align}
        showFullscreen={showFullscreen}
        onDownload={downloadMedia}
        onOpen={openMedia}
        openLabel={openLabel}
        isDownloading={isDownloading}
        locale={locale}
        onError={handlePlaybackError}
      />
      {hasPlaybackError && (
        <VideoPlaybackErrorOverlay onRetry={retryPlayback} />
      )}
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
