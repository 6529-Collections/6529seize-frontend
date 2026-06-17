"use client";

import { fullScreenSupported } from "@/helpers/Helpers";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";

type VideoLayout = "natural" | "fill" | "prominent";
type VideoAlign = "left" | "center";

interface SeizeVideoPlayerProps {
  readonly src?: string | undefined;
  readonly videoRef?: React.RefObject<HTMLVideoElement | null> | undefined;
  readonly id?: string | undefined;
  readonly autoPlay?: boolean | undefined;
  readonly muted?: boolean | undefined;
  readonly loop?: boolean | undefined;
  readonly preload?: "auto" | "metadata" | "none" | undefined;
  readonly poster?: string | undefined;
  readonly captionsSrc?: string | undefined;
  readonly layout?: VideoLayout | undefined;
  readonly align?: VideoAlign | undefined;
  readonly className?: string | undefined;
  readonly videoClassName?: string | undefined;
  readonly showActions?: boolean | undefined;
  readonly onDownload?: (() => void) | undefined;
  readonly onOpen?: (() => void) | undefined;
  readonly openLabel?: string | undefined;
  readonly isDownloading?: boolean | undefined;
  readonly fallbackSources?: readonly string[] | undefined;
  readonly onVideoClick?:
    | ((event: React.MouseEvent<HTMLDivElement>) => void)
    | undefined;
  readonly onError?: React.ReactEventHandler<HTMLVideoElement> | undefined;
  readonly "aria-label"?: string | undefined;
  readonly "data-testid"?: string | undefined;
  readonly "data-mime"?: string | undefined;
  readonly "data-url"?: string | undefined;
  readonly "data-disable"?: string | undefined;
}

const EMPTY_CAPTIONS_SRC = "data:text/vtt,WEBVTT";
const CONTROL_HIDE_DELAY_MS = 1800;

type FullscreenDocument = Document & {
  readonly webkitFullscreenElement?: Element | null;
  readonly mozFullScreenElement?: Element | null;
  readonly msFullscreenElement?: Element | null;
  readonly webkitFullscreenEnabled?: boolean | undefined;
  readonly mozFullScreenEnabled?: boolean | undefined;
  readonly msFullscreenEnabled?: boolean | undefined;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type NativeFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitEnterFullScreen?: () => void;
};

function getFullscreenElement() {
  const doc = document as FullscreenDocument;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

function isFullscreenEnabled() {
  const doc = document as FullscreenDocument;
  if (document.fullscreenEnabled) {
    return true;
  }
  if (doc.webkitFullscreenEnabled === true) {
    return true;
  }
  if (doc.mozFullScreenEnabled === true) {
    return true;
  }
  if (doc.msFullscreenEnabled === true) {
    return true;
  }
  return fullScreenSupported();
}

async function enterFullscreen(element: FullscreenElement) {
  if (typeof element.requestFullscreen === "function") {
    await element.requestFullscreen();
    return true;
  } else if (typeof element.webkitRequestFullscreen === "function") {
    await element.webkitRequestFullscreen();
    return true;
  } else if (typeof element.mozRequestFullScreen === "function") {
    await element.mozRequestFullScreen();
    return true;
  } else if (typeof element.msRequestFullscreen === "function") {
    await element.msRequestFullscreen();
    return true;
  }
  return false;
}

async function exitFullscreen() {
  const doc = document as FullscreenDocument;
  if (typeof document.exitFullscreen === "function") {
    await document.exitFullscreen();
  } else if (typeof doc.webkitExitFullscreen === "function") {
    await doc.webkitExitFullscreen();
  } else if (typeof doc.mozCancelFullScreen === "function") {
    await doc.mozCancelFullScreen();
  } else if (typeof doc.msExitFullscreen === "function") {
    await doc.msExitFullscreen();
  }
}

function enterNativeVideoFullscreen(video: HTMLVideoElement | null) {
  if (!video) {
    return false;
  }

  const nativeFullscreenVideo = video as NativeFullscreenVideo;
  if (typeof nativeFullscreenVideo.webkitEnterFullscreen === "function") {
    nativeFullscreenVideo.webkitEnterFullscreen();
    return true;
  }
  if (typeof nativeFullscreenVideo.webkitEnterFullScreen === "function") {
    nativeFullscreenVideo.webkitEnterFullScreen();
    return true;
  }
  return false;
}

function getAspectRatio(width: number, height: number): string | undefined {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return undefined;
  }
  if (width <= 0 || height <= 0) {
    return undefined;
  }
  return `${width} / ${height}`;
}

function getOrientation(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return "unknown";
  }
  if (width > height * 1.08) {
    return "landscape";
  }
  if (height > width * 1.08) {
    return "portrait";
  }
  return "square";
}

function getNaturalWidthClassName(orientation: string, layout: VideoLayout) {
  if (layout === "fill") {
    return "tw-h-full tw-w-full";
  }

  if (layout === "prominent") {
    if (orientation === "portrait") {
      return "tw-w-[min(100%,34rem)]";
    }
    if (orientation === "square") {
      return "tw-w-[min(100%,42rem)]";
    }
    return "tw-w-full";
  }

  if (orientation === "portrait") {
    return "tw-w-[min(100%,24rem)]";
  }
  if (orientation === "square") {
    return "tw-w-[min(100%,32rem)]";
  }
  return "tw-w-full";
}

function SeizeVideoControlButton({
  label,
  onClick,
  children,
  disabled = false,
}: {
  readonly label: string;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly children: React.ReactNode;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950/70 tw-text-white tw-shadow-lg tw-shadow-black/25 tw-backdrop-blur-md tw-transition tw-duration-200 disabled:tw-cursor-default disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800/90"
    >
      {children}
    </button>
  );
}

export default function SeizeVideoPlayer({
  src,
  videoRef,
  id,
  autoPlay = true,
  muted = true,
  loop = true,
  preload = "auto",
  poster,
  captionsSrc,
  layout = "natural",
  align = "left",
  className,
  videoClassName,
  showActions = true,
  onDownload,
  onOpen,
  openLabel,
  isDownloading = false,
  fallbackSources,
  onVideoClick,
  onError,
  "aria-label": ariaLabel,
  "data-testid": dataTestId,
  "data-mime": dataMime,
  "data-url": dataUrl,
  "data-disable": dataDisable,
}: SeizeVideoPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resolvedVideoRef = videoRef ?? internalVideoRef;
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();
  const [orientation, setOrientation] = useState("unknown");
  const [mutedState, setMutedState] = useState<{
    readonly src?: string | undefined;
    readonly prop?: boolean | undefined;
    readonly value?: boolean | undefined;
  }>({});
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoSize, setVideoSize] = useState<
    | {
        readonly width: number;
        readonly height: number;
      }
    | undefined
  >();
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(
    () => (typeof window === "undefined" ? undefined : window.innerHeight)
  );
  const [fallbackState, setFallbackState] = useState<{
    readonly originSrc?: string | undefined;
    readonly source?: string | undefined;
  }>({});

  const orderedFallbackSources = useMemo(() => {
    const sources = [src, ...(fallbackSources ?? [])].filter(
      (value): value is string => Boolean(value)
    );
    return Array.from(new Set(sources));
  }, [fallbackSources, src]);

  function clearHideControlsTimer() {
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }

  function hideControlsSoon() {
    clearHideControlsTimer();
    hideControlsTimerRef.current = window.setTimeout(() => {
      const video = resolvedVideoRef.current;
      if (video && !video.paused) {
        setControlsVisible(false);
      }
    }, CONTROL_HIDE_DELAY_MS);
  }

  function revealControls() {
    setControlsVisible(true);
    hideControlsSoon();
  }

  function updateProgress() {
    const video = resolvedVideoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      setProgress(0);
      return;
    }
    setProgress(Math.min(100, (video.currentTime / video.duration) * 100));
  }

  function stopProgressAnimation() {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function startProgressAnimation() {
    stopProgressAnimation();
    const tick = () => {
      updateProgress();
      const video = resolvedVideoRef.current;
      if (video && !video.paused && !video.ended) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };
    animationFrameRef.current = window.requestAnimationFrame(tick);
  }

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", updateViewportHeight);
    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(getFullscreenElement() === wrapperRef.current);
      setControlsVisible(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      clearHideControlsTimer();
      stopProgressAnimation();
    };
  }, []);

  function handleMetadata() {
    const video = resolvedVideoRef.current;
    if (!video) return;
    setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    setAspectRatio(getAspectRatio(video.videoWidth, video.videoHeight));
    setOrientation(getOrientation(video.videoWidth, video.videoHeight));
    updateProgress();
  }

  function handlePlay() {
    setIsPaused(false);
    startProgressAnimation();
    hideControlsSoon();
  }

  function handlePause() {
    setIsPaused(true);
    setControlsVisible(true);
    stopProgressAnimation();
    updateProgress();
  }

  function togglePlayback() {
    const video = resolvedVideoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }

  function toggleMuted(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setMutedState({ prop: muted, src, value: !isMuted });
    revealControls();
  }

  async function requestFullscreen(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = wrapperRef.current;
    const video = resolvedVideoRef.current;
    if (!wrapper) {
      enterNativeVideoFullscreen(video);
      revealControls();
      return;
    }

    if (!isFullscreenEnabled()) {
      enterNativeVideoFullscreen(video);
      revealControls();
      return;
    }

    if (getFullscreenElement() === wrapper) {
      await exitFullscreen().catch(() => undefined);
      revealControls();
      return;
    }

    const enteredWrapper = await enterFullscreen(
      wrapper as FullscreenElement
    ).catch(() => false);
    if (!enteredWrapper) {
      enterNativeVideoFullscreen(video);
    }
    revealControls();
  }

  function handleWrapperClick(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    onVideoClick?.(event);
    revealControls();
    togglePlayback();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    revealControls();
    togglePlayback();
  }

  function handleError(event: React.SyntheticEvent<HTMLVideoElement, Event>) {
    const currentIndex = orderedFallbackSources.findIndex(
      (candidate) => candidate === directSrc
    );
    const nextSource = orderedFallbackSources[currentIndex + 1];
    if (nextSource) {
      event.currentTarget.src = nextSource;
      event.currentTarget.load();
      setFallbackState({ originSrc: src, source: nextSource });
      return;
    }
    onError?.(event);
  }

  const stopAndRun =
    (handler: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
      revealControls();
    };

  function getResponsiveMediaStyle(): React.CSSProperties | undefined {
    if (isFillLayout) {
      return undefined;
    }

    const style: React.CSSProperties = {};
    if (aspectRatio) {
      style.aspectRatio = aspectRatio;
    }

    if (isFullscreen) {
      return style;
    }

    const fallbackViewportHeight = viewportHeight ?? 900;
    const maxViewportHeight =
      layout === "prominent"
        ? Math.max(320, fallbackViewportHeight - 220)
        : Math.max(260, fallbackViewportHeight - 160);
    const maxHeight = Math.min(
      layout === "prominent" ? 650 : 520,
      maxViewportHeight
    );
    style.maxHeight = `${maxHeight}px`;

    if (videoSize && videoSize.height > videoSize.width) {
      const ratio = videoSize.width / videoSize.height;
      style.maxWidth = `${Math.floor(maxHeight * ratio)}px`;
    }

    return style;
  }

  const isFillLayout = layout === "fill";
  const widthClassName = getNaturalWidthClassName(orientation, layout);
  const isMuted =
    mutedState.src === src &&
    mutedState.prop === muted &&
    typeof mutedState.value === "boolean"
      ? mutedState.value
      : muted;
  const controlsAreVisible = controlsVisible || isPaused || isFullscreen;
  const responsiveMediaStyle = getResponsiveMediaStyle();
  const directSrc =
    fallbackState.originSrc === src ? (fallbackState.source ?? src) : src;
  const videoSourceProps = directSrc ? { src: directSrc } : {};

  return (
    <div
      ref={wrapperRef}
      role="group"
      tabIndex={0}
      aria-label={ariaLabel ?? "Video player"}
      onClick={handleWrapperClick}
      onKeyDown={handleKeyDown}
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onMouseLeave={() => {
        clearHideControlsTimer();
        if (!isPaused) {
          setControlsVisible(false);
        }
      }}
      onTouchStart={revealControls}
      className={clsx(
        "tw-relative tw-max-w-full tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-bg-transparent tw-outline-none tw-ring-primary-400/0 tw-transition focus-visible:tw-ring-2",
        widthClassName,
        align === "center" && "tw-mx-auto",
        isFillLayout && "tw-flex tw-items-center tw-justify-center",
        isFullscreen && "tw-h-screen tw-w-screen tw-rounded-none tw-bg-black",
        className
      )}
      style={responsiveMediaStyle}
      data-testid={dataTestId}
      data-mime={dataMime}
      data-url={dataUrl}
      data-disable={dataDisable}
    >
      <video
        id={id}
        ref={resolvedVideoRef}
        {...videoSourceProps}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        preload={preload}
        poster={poster}
        controls={false}
        controlsList="nodownload noplaybackrate"
        {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
        onLoadedMetadata={handleMetadata}
        onDurationChange={updateProgress}
        onTimeUpdate={updateProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
        onError={handleError}
        className={clsx(
          "tw-block tw-h-full tw-w-full tw-rounded-xl tw-object-contain",
          isFullscreen && "tw-rounded-none",
          videoClassName
        )}
      >
        {directSrc && <source src={directSrc} />}
        <track
          kind="captions"
          src={captionsSrc ?? EMPTY_CAPTIONS_SRC}
          srcLang="en"
          label="No captions available"
        />
        Your browser does not support the video tag.
      </video>

      <div
        className={clsx(
          "tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-transition-opacity tw-duration-200",
          controlsAreVisible ? "tw-opacity-100" : "tw-opacity-0"
        )}
      >
        {isPaused && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            <div className="tw-flex tw-size-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950/65 tw-text-white tw-shadow-xl tw-shadow-black/30 tw-backdrop-blur-md">
              <PlayIcon className="tw-ml-1 tw-size-8" aria-hidden="true" />
            </div>
          </div>
        )}

        <div className="tw-pointer-events-auto tw-absolute tw-bottom-4 tw-left-3">
          <SeizeVideoControlButton
            label={isMuted ? "Unmute video" : "Mute video"}
            onClick={toggleMuted}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="tw-size-5" aria-hidden="true" />
            ) : (
              <SpeakerWaveIcon className="tw-size-5" aria-hidden="true" />
            )}
          </SeizeVideoControlButton>
        </div>

        <div className="tw-pointer-events-auto tw-absolute tw-bottom-4 tw-right-3 tw-flex tw-items-center tw-gap-2">
          {isPaused && (
            <SeizeVideoControlButton
              label="Play video"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                togglePlayback();
              }}
            >
              <PlayIcon className="tw-ml-0.5 tw-size-5" aria-hidden="true" />
            </SeizeVideoControlButton>
          )}
          {!isPaused && (
            <SeizeVideoControlButton
              label="Pause video"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                togglePlayback();
              }}
            >
              <PauseIcon className="tw-size-5" aria-hidden="true" />
            </SeizeVideoControlButton>
          )}
          {showActions && onOpen && openLabel && (
            <SeizeVideoControlButton
              label={openLabel}
              onClick={stopAndRun(onOpen)}
            >
              <ArrowTopRightOnSquareIcon
                className="tw-size-5"
                aria-hidden="true"
              />
            </SeizeVideoControlButton>
          )}
          {showActions && onDownload && (
            <SeizeVideoControlButton
              label={isDownloading ? "Downloading media" : "Download media"}
              onClick={stopAndRun(onDownload)}
              disabled={isDownloading}
            >
              <ArrowDownTrayIcon className="tw-size-5" aria-hidden="true" />
            </SeizeVideoControlButton>
          )}
          <SeizeVideoControlButton
            label={isFullscreen ? "Exit full screen" : "Full screen"}
            onClick={requestFullscreen}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="tw-size-5" aria-hidden="true" />
            ) : (
              <ArrowsPointingOutIcon className="tw-size-5" aria-hidden="true" />
            )}
          </SeizeVideoControlButton>
        </div>
      </div>

      <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-z-30 tw-h-1 tw-bg-white/20">
        <div
          className="tw-h-full tw-bg-primary-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
