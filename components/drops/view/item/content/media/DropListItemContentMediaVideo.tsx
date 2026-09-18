"use client";

import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import clsx from "clsx";
import React, { useEffect, useRef } from "react";
import SeizeVideoPlayer from "./SeizeVideoPlayer";
import { usePrefersReducedMotion } from "./SeizeVideoPlayer.config";
import VideoPlaybackErrorOverlay from "./VideoPlaybackErrorOverlay";
import { useVideoPlaybackError } from "./useVideoPlaybackError";
import { useMediaActions } from "./useMediaActions";
import type { MediaLoadStrategy } from "./mediaLoadStrategy";

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
  const [wrapperRef, inView] = useInView<HTMLDivElement>({
    freezeOnceVisible: false,
    rootMargin: "400px 0px",
    threshold: 0.1,
  });
  const wasFullscreenRef = useRef(false);
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldLoadVideo = loadStrategy === "eager" || inView;
  const canAutoPlayInCurrentEnvironment = allowAutoPlayInApp
    ? !prefersReducedMotion
    : !isApp;
  const shouldAutoPlay =
    inView && !disableAutoPlay && canAutoPlayInCurrentEnvironment;
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "video",
      dialogTitle: "Save video",
      mimeType,
    });

  // 1) Pick up the best URL (HLS or MP4)
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    enabled: shouldLoadVideo,
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // 2) Setup HLS (or native) once and get back the videoRef + loading state
  const { videoRef, isLoading, retry } = useHlsPlayer({
    enabled: shouldLoadVideo,
    src: playableUrl,
    isHls,
    fallbackSrc: src,
    autoPlay: shouldAutoPlay,
  });

  // 3) Play/pause & mute based on scroll visibility
  const { handlePlaybackError, hasPlaybackError, retryPlayback } =
    useVideoPlaybackError({
      onRetry: retry,
      resetKey: playableUrl,
      videoRef,
    });

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isLoading) return;
    const fullscreenElement = document.fullscreenElement;
    if (fullscreenElement?.contains(videoEl) ?? false) {
      wasFullscreenRef.current = true;
      return;
    }

    if (shouldAutoPlay) {
      // ensure muted autoplay works
      videoEl.muted = true;
      if (!isApp) videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
      videoEl.muted = true;
    }
  }, [shouldAutoPlay, isApp, isLoading, videoRef]);

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
      if (fullscreenElement?.contains(videoEl) ?? false) {
        wasFullscreenRef.current = true;
        return;
      }

      if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        videoEl.pause();
      }
    };

    document.addEventListener("fullscreenchange", pauseWhenFullscreenCloses);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        pauseWhenFullscreenCloses
      );
    };
  }, [isApp, videoRef]);

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
        videoRef={videoRef}
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
