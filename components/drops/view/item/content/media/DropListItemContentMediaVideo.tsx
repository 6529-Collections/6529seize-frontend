"use client";

import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { PlayIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import React, { useEffect } from "react";
import { InlineMediaActions } from "./MediaActionToolbar";
import { useMediaActions } from "./useMediaActions";

interface Props {
  readonly src: string;
  readonly disableAutoPlay?: boolean | undefined;
  readonly fillContainer?: boolean | undefined;
}

function DropListItemContentMediaVideo({
  src,
  disableAutoPlay = false,
  fillContainer = false,
}: Props) {
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { isApp } = useDeviceInfo();
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "video",
      dialogTitle: "Save video",
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
  const showNativeControls = !isApp;

  // 3) Play/pause & mute based on scroll visibility
  const shouldAutoPlay = inView && !isApp && !disableAutoPlay;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isLoading) return;

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
      if (!videoEl || document.fullscreenElement === videoEl) {
        return;
      }

      videoEl.pause();
    };

    document.addEventListener("fullscreenchange", pauseWhenFullscreenCloses);
    return () => {
      document.removeEventListener(
        "fullscreenchange",
        pauseWhenFullscreenCloses
      );
    };
  }, [isApp, videoRef]);

  const enterFullscreenAndPlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    videoEl.play().catch(() => undefined);
    videoEl.requestFullscreen().catch(() => undefined);
  };

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "tw-group tw-relative tw-flex tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-bg-black",
        fillContainer
          ? "tw-h-full tw-max-h-full"
          : "tw-max-h-64 tw-min-h-[200px]"
      )}
    >
      <video
        ref={videoRef}
        onClick={() => {
          if (!isApp) {
            return;
          }
          enterFullscreenAndPlay();
        }}
        playsInline
        controls={showNativeControls}
        controlsList="noplaybackrate"
        autoPlay={false}
        muted
        loop
        className={clsx(
          "tw-w-full tw-rounded-xl tw-object-contain",
          fillContainer ? "tw-h-full tw-max-h-full" : "tw-h-auto tw-max-h-64"
        )}
      >
        Your browser does not support the video tag.
      </video>
      {isApp && (
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
      <InlineMediaActions
        variant="video"
        onDownload={downloadMedia}
        onOpen={openMedia}
        openLabel={openLabel}
        isDownloading={isDownloading}
      />
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
