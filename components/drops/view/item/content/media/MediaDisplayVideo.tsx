"use client";

import React, { useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { PlayIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { InlineMediaActions } from "./MediaActionToolbar";
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
  const showNativeControls = showControls && !isApp;

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
      if (!vid || document.fullscreenElement === vid) {
        return;
      }

      vid.pause();
    };

    document.addEventListener("fullscreenchange", pauseWhenFullscreenCloses);
    return () => {
      document.removeEventListener(
        "fullscreenchange",
        pauseWhenFullscreenCloses
      );
    };
  }, [isApp, videoRef]);

  const handleVideoClick = () => {
    if (showControls) {
      return;
    }

    const vid = videoRef.current;
    if (!vid) {
      return;
    }

    if (vid.paused) {
      vid.play().catch(() => {});
      return;
    }

    vid.pause();
  };

  const enterFullscreenAndPlay = () => {
    const vid = videoRef.current;
    if (!vid) {
      return;
    }

    vid.play().catch(() => undefined);
    vid.requestFullscreen().catch(() => undefined);
  };

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "tw-relative tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-black",
        fillContainer
          ? "tw-flex tw-h-full tw-max-h-full tw-items-center tw-justify-center"
          : "tw-max-h-64 tw-min-h-[200px]"
      )}
    >
      <video
        ref={videoRef}
        onClick={() => {
          if (showControls && isApp) {
            enterFullscreenAndPlay();
            return;
          }
          handleVideoClick();
        }}
        className={clsx(
          "tw-w-full tw-rounded-xl tw-object-contain",
          fillContainer ? "tw-h-full tw-max-h-full" : "tw-h-auto tw-max-h-64"
        )}
        muted
        loop
        controls={showNativeControls}
        controlsList="nodownload noplaybackrate"
        playsInline
        preload="auto"
      />
      {showControls && isApp && (
        <button
          type="button"
          aria-label="Play video"
          title="Play video"
          onClick={(event) => {
            event.stopPropagation();
            enterFullscreenAndPlay();
          }}
          className="tw-absolute tw-left-1/2 tw-top-1/2 tw-z-20 tw-flex tw-size-16 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700/75 tw-text-white tw-shadow-lg tw-shadow-black/30 tw-backdrop-blur-sm"
        >
          <PlayIcon className="tw-ml-1 tw-size-8" aria-hidden="true" />
        </button>
      )}
      {showControls && (
        <InlineMediaActions
          variant="video"
          onDownload={downloadMedia}
          onOpen={openMedia}
          openLabel={openLabel}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
};

export default React.memo(MediaDisplayVideo);
