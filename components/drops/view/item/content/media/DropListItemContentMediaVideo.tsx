"use client";

import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import clsx from "clsx";
import React, { useEffect, useRef } from "react";
import SeizeVideoPlayer from "./SeizeVideoPlayer";
import { useMediaActions } from "./useMediaActions";

interface Props {
  readonly src: string;
  readonly mimeType?: string | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly fillContainer?: boolean | undefined;
  readonly align?: "left" | "center" | undefined;
  readonly showFullscreen?: boolean | undefined;
}

function DropListItemContentMediaVideo({
  src,
  mimeType,
  disableAutoPlay = false,
  fillContainer = false,
  align = "left",
  showFullscreen = true,
}: Props) {
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const wasFullscreenRef = useRef(false);
  const { isApp } = useDeviceInfo();
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "video",
      dialogTitle: "Save video",
      mimeType,
    });

  // 1) Pick up the best URL (HLS or MP4)
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // 2) Setup HLS (or native) once and get back the videoRef + loading state
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src,
    autoPlay: inView && !isApp && !disableAutoPlay,
  });

  // 3) Play/pause & mute based on scroll visibility
  const shouldAutoPlay = inView && !isApp && !disableAutoPlay;

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

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "tw-flex tw-w-full tw-items-start tw-justify-start",
        fillContainer && "tw-h-full tw-max-h-full"
      )}
    >
      <SeizeVideoPlayer
        videoRef={videoRef}
        template="ambient-media"
        layout={fillContainer ? "fill" : "natural"}
        align={align}
        showFullscreen={showFullscreen}
        onDownload={downloadMedia}
        onOpen={openMedia}
        openLabel={openLabel}
        isDownloading={isDownloading}
        onVideoClick={(event) => {
          event.preventDefault();
        }}
      />
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
