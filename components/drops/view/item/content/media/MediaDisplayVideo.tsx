"use client";

import React, { useEffect, useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import clsx from "clsx";
import SeizeVideoPlayer from "./SeizeVideoPlayer";
import { useMediaActions } from "./useMediaActions";

interface Props {
  readonly src: string;
  readonly mimeType?: string | undefined;
  readonly showControls?: boolean | undefined;
  readonly fillContainer?: boolean | undefined;
}

const MediaDisplayVideo: React.FC<Props> = ({
  src,
  mimeType,
  showControls = false,
  fillContainer = false,
}) => {
  // Intersection observer for scroll-based triggers
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

  // Poll for HLS → MP4 → fallback original
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 15000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // Use HLS hook to handle the video ref, loading states, etc.
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src, // if HLS fails, revert to original
    autoPlay: inView && !isApp, // only autoplay if in view and not in app
  });
  // Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  // Additional effect: if out of view, we can pause
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isLoading) return;
    const fullscreenElement = document.fullscreenElement;
    if (fullscreenElement?.contains(vid) ?? false) {
      wasFullscreenRef.current = true;
      return;
    }

    if (!inView || isApp) {
      vid.pause();
    } else {
      // Attempt to play if we're in view
      vid.play().catch(() => {});
    }
  }, [inView, isApp, isLoading, videoRef]);

  useEffect(() => {
    if (!isApp) {
      return;
    }

    const pauseWhenFullscreenCloses = () => {
      const vid = videoRef.current;
      if (!vid) {
        return;
      }

      const fullscreenElement = document.fullscreenElement;
      if (fullscreenElement?.contains(vid) ?? false) {
        wasFullscreenRef.current = true;
        return;
      }

      if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        vid.pause();
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
        "tw-flex tw-w-full tw-items-start",
        fillContainer
          ? "tw-h-full tw-max-h-full tw-justify-center"
          : "tw-justify-start"
      )}
    >
      <SeizeVideoPlayer
        videoRef={videoRef}
        template="ambient-media"
        layout={fillContainer ? "fill" : "natural"}
        align={fillContainer ? "center" : "left"}
        showActions={showControls}
        onDownload={showControls ? downloadMedia : undefined}
        onOpen={showControls ? openMedia : undefined}
        openLabel={showControls ? openLabel : undefined}
        isDownloading={isDownloading}
      />
    </div>
  );
};

export default React.memo(MediaDisplayVideo);
