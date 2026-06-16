"use client";

import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { InlineMediaActions } from "./MediaActionToolbar";
import { useMediaActions } from "./useMediaActions";

interface Props {
  readonly src: string;
  readonly mimeType?: string | undefined;
  readonly disableAutoPlay?: boolean | undefined;
  readonly fillContainer?: boolean | undefined;
}

const CONTROL_BUTTON_CLASS =
  "tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950/85 tw-text-white tw-shadow-lg tw-shadow-black/25 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-backdrop-blur tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const PLAYER_CHROME_VISIBILITY_CLASS =
  "tw-opacity-0 tw-transition-opacity tw-duration-200 group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100";

function getPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function DropListItemContentMediaVideo({
  src,
  mimeType,
  disableAutoPlay = false,
  fillContainer = false,
}: Props) {
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const { isApp } = useDeviceInfo();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getPrefersReducedMotion
  );
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
    autoPlay: inView && !isApp && !disableAutoPlay && !prefersReducedMotion,
  });

  // 3) Play/pause & mute based on scroll visibility
  const shouldAutoPlay =
    inView && !isApp && !disableAutoPlay && !prefersReducedMotion;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isLoading) return;

    if (shouldAutoPlay) {
      // ensure muted autoplay works
      videoEl.muted = true;
      setIsMuted(true);
      if (!isApp) {
        videoEl.play().catch(() => undefined);
      }
    } else {
      videoEl.pause();
      if (!isApp && disableAutoPlay) {
        videoEl.muted = true;
        setIsMuted(true);
      }
    }
  }, [shouldAutoPlay, isApp, disableAutoPlay, isLoading, videoRef]);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") {
      return;
    }

    const mediaQuery = globalThis.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener?.("change", handleChange);
    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

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

  const syncMediaState = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    setIsMuted(videoEl.muted);
    setCurrentTime(
      Number.isFinite(videoEl.currentTime) ? videoEl.currentTime : 0
    );
    setDuration(Number.isFinite(videoEl.duration) ? videoEl.duration : 0);
  }, [videoRef]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    const updateTime = () => {
      setCurrentTime(
        Number.isFinite(videoEl.currentTime) ? videoEl.currentTime : 0
      );
    };
    const updateDuration = () => {
      setDuration(Number.isFinite(videoEl.duration) ? videoEl.duration : 0);
    };
    const updateMuted = () => setIsMuted(videoEl.muted);

    syncMediaState();
    videoEl.addEventListener("timeupdate", updateTime);
    videoEl.addEventListener("loadedmetadata", updateDuration);
    videoEl.addEventListener("durationchange", updateDuration);
    videoEl.addEventListener("volumechange", updateMuted);
    return () => {
      videoEl.removeEventListener("timeupdate", updateTime);
      videoEl.removeEventListener("loadedmetadata", updateDuration);
      videoEl.removeEventListener("durationchange", updateDuration);
      videoEl.removeEventListener("volumechange", updateMuted);
    };
  }, [syncMediaState, videoRef, playableUrl]);

  const playVideo = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    videoEl.play().catch(() => undefined);
  }, [videoRef]);

  const pauseVideo = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    videoEl.pause();
  }, [videoRef]);

  const togglePlayback = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    if (videoEl.paused || videoEl.ended) {
      playVideo();
      return;
    }

    pauseVideo();
  }, [pauseVideo, playVideo, videoRef]);

  const toggleMuted = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  }, [videoRef]);

  const seekTo = useCallback(
    (value: string) => {
      const videoEl = videoRef.current;
      if (!videoEl) {
        return;
      }

      const nextTime = Number.parseFloat(value);
      if (!Number.isFinite(nextTime)) {
        return;
      }

      videoEl.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [videoRef]
  );

  const enterFullscreenAndPlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    playVideo();
    const fullscreenTarget = isApp ? videoEl : fullscreenRef.current;
    fullscreenTarget?.requestFullscreen().catch(() => undefined);
  };

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "tw-group tw-relative tw-flex tw-w-fit tw-max-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl",
        fillContainer ? "tw-h-full tw-max-h-full" : "tw-max-h-64"
      )}
    >
      <div
        ref={fullscreenRef}
        className={clsx(
          "tw-relative tw-flex tw-w-fit tw-max-w-full tw-items-center tw-justify-center",
          fillContainer ? "tw-h-full tw-max-h-full" : "tw-max-h-64"
        )}
      >
        <video
          ref={videoRef}
          aria-label="Video. Press Enter or Space to play or pause."
          onClick={() => {
            if (isApp) {
              enterFullscreenAndPlay();
              return;
            }
            togglePlayback();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") {
              return;
            }

            event.preventDefault();
            if (isApp) {
              enterFullscreenAndPlay();
              return;
            }
            togglePlayback();
          }}
          playsInline
          controls={false}
          autoPlay={false}
          muted
          loop
          preload="auto"
          tabIndex={0}
          className={clsx(
            "tw-rounded-xl tw-object-contain",
            fillContainer
              ? "tw-h-full tw-max-h-full tw-w-auto tw-max-w-full"
              : "tw-h-auto tw-max-h-64 tw-w-auto tw-max-w-full"
          )}
        >
          Your browser does not support the video tag.
        </video>
        {!isApp && (
          <button
            type="button"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            title={isMuted ? "Unmute video" : "Mute video"}
            onClick={(event) => {
              event.stopPropagation();
              toggleMuted();
            }}
            className={clsx(
              "tw-absolute tw-bottom-5 tw-left-3 tw-z-30 sm:tw-left-4",
              CONTROL_BUTTON_CLASS,
              PLAYER_CHROME_VISIBILITY_CLASS
            )}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="tw-size-5" aria-hidden="true" />
            ) : (
              <SpeakerWaveIcon className="tw-size-5" aria-hidden="true" />
            )}
          </button>
        )}
        {!isApp && (
          <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-30 tw-h-1 tw-overflow-hidden tw-bg-white/45">
            <div
              className="tw-h-full tw-bg-primary-400"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              aria-label="Video progress"
              min={0}
              max={duration > 0 ? duration : 0}
              step="0.01"
              value={Math.min(currentTime, duration || currentTime)}
              disabled={duration <= 0}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => seekTo(event.currentTarget.value)}
              className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-6 tw-w-full tw-cursor-pointer tw-opacity-0 disabled:tw-cursor-default"
            />
          </div>
        )}
      </div>
      <InlineMediaActions
        variant="video"
        onDownload={downloadMedia}
        onFullscreen={enterFullscreenAndPlay}
        onOpen={openMedia}
        openLabel={openLabel}
        isDownloading={isDownloading}
        fullscreenTargetAvailable={!isApp}
        className={PLAYER_CHROME_VISIBILITY_CLASS}
      />
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
