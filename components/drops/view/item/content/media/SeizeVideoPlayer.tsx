"use client";

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
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  assignRef,
  getAspectRatio,
  getNaturalWidthClassName,
  getOrientation,
  resolveSeizeVideoTemplate,
  useElementInView,
  usePrefersReducedMotion,
} from "./SeizeVideoPlayer.config";
import type {
  SeizeVideoControls,
  SeizeVideoMode,
  SeizeVideoTemplate,
  VideoAlign,
  VideoLayout,
} from "./SeizeVideoPlayer.config";
import {
  enterFullscreen,
  enterNativeVideoFullscreen,
  exitFullscreen,
  getFullscreenElement,
  isFullscreenEnabled,
} from "./SeizeVideoPlayer.fullscreen";
import type {
  FullscreenElement,
  NativeFullscreenVideo,
} from "./SeizeVideoPlayer.fullscreen";

export type { SeizeVideoControls, SeizeVideoMode, SeizeVideoTemplate };

interface SeizeVideoPlayerProps {
  readonly src?: string | undefined;
  readonly videoRef?: React.Ref<HTMLVideoElement | null> | undefined;
  readonly id?: string | undefined;
  readonly template?: SeizeVideoTemplate | undefined;
  readonly mode?: SeizeVideoMode | undefined;
  readonly controls?: SeizeVideoControls | undefined;
  readonly autoPlay?: boolean | undefined;
  readonly muted?: boolean | undefined;
  readonly loop?: boolean | undefined;
  readonly preload?: "auto" | "metadata" | "none" | undefined;
  readonly poster?: string | undefined;
  readonly captionsSrc?: string | undefined;
  readonly captionsLabel?: string | undefined;
  readonly captionsLang?: string | undefined;
  readonly captionsDefault?: boolean | undefined;
  readonly locale?: SupportedLocale | undefined;
  readonly layout?: VideoLayout | undefined;
  readonly align?: VideoAlign | undefined;
  readonly className?: string | undefined;
  readonly videoClassName?: string | undefined;
  readonly showActions?: boolean | undefined;
  readonly showFullscreen?: boolean | undefined;
  readonly onDownload?: (() => void) | undefined;
  readonly onOpen?: (() => void) | undefined;
  readonly openLabel?: string | undefined;
  readonly isDownloading?: boolean | undefined;
  readonly fallbackSources?: readonly string[] | undefined;
  readonly onVideoClick?:
    | ((event: React.MouseEvent<HTMLElement>) => void)
    | undefined;
  readonly onError?: React.ReactEventHandler<HTMLVideoElement> | undefined;
  readonly "aria-label"?: string | undefined;
  readonly "data-testid"?: string | undefined;
  readonly "data-mime"?: string | undefined;
  readonly "data-url"?: string | undefined;
  readonly "data-disable"?: string | undefined;
}

const CONTROL_HIDE_DELAY_MS = 1800;

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
  template = "ambient-media",
  mode,
  controls,
  autoPlay,
  muted,
  loop,
  preload,
  poster,
  captionsSrc,
  captionsLabel,
  captionsLang = DEFAULT_LOCALE,
  captionsDefault = false,
  locale = DEFAULT_LOCALE,
  layout = "natural",
  align = "left",
  className,
  videoClassName,
  showActions = true,
  showFullscreen = true,
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(
    null
  );
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const resolvedTemplate = useMemo(
    () =>
      resolveSeizeVideoTemplate({
        autoPlay,
        controls,
        loop,
        mode,
        muted,
        preload,
        template,
      }),
    [autoPlay, controls, loop, mode, muted, preload, template]
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();
  const [orientation, setOrientation] = useState("unknown");
  const [mutedState, setMutedState] = useState<{
    readonly src?: string | undefined;
    readonly prop?: boolean | undefined;
    readonly value?: boolean | undefined;
  }>({});
  const [isPaused, setIsPaused] = useState(!resolvedTemplate.autoPlay);
  const [, setControlsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [openPosterGateKey, setOpenPosterGateKey] = useState<string | null>(
    null
  );
  const [userPausedAutoplaySrc, setUserPausedAutoplaySrc] = useState<
    string | null
  >(null);
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
  const isInView = useElementInView(wrapperElement);

  const setWrapperRef = useCallback((element: HTMLDivElement | null) => {
    wrapperRef.current = element;
    setWrapperElement(element);
  }, []);
  const setVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      assignRef(videoRef, element);
      setVideoElement(element);
    },
    [videoRef]
  );

  function clearHideControlsTimer() {
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }

  function hideControlsSoon() {
    if (effectiveControls !== "minimal") {
      return;
    }
    clearHideControlsTimer();
    hideControlsTimerRef.current = window.setTimeout(() => {
      const video = videoElement;
      if (video && !video.paused) {
        setControlsVisible(false);
      }
    }, CONTROL_HIDE_DELAY_MS);
  }

  function revealControls() {
    if (effectiveControls !== "minimal") {
      return;
    }
    setControlsVisible(true);
    hideControlsSoon();
  }

  function updateProgress() {
    const video = videoElement;
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
      const video = videoElement;
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
    const video = videoElement;
    if (!video) {
      return;
    }

    const handleNativeFullscreenBegin = () => {
      setIsNativeFullscreen(true);
      setControlsVisible(true);
    };
    const handleNativeFullscreenEnd = () => {
      setIsNativeFullscreen(false);
      setControlsVisible(true);
    };

    video.addEventListener(
      "webkitbeginfullscreen",
      handleNativeFullscreenBegin
    );
    video.addEventListener("webkitendfullscreen", handleNativeFullscreenEnd);
    return () => {
      video.removeEventListener(
        "webkitbeginfullscreen",
        handleNativeFullscreenBegin
      );
      video.removeEventListener(
        "webkitendfullscreen",
        handleNativeFullscreenEnd
      );
    };
  }, [videoElement]);

  useEffect(() => {
    return () => {
      clearHideControlsTimer();
      stopProgressAnimation();
    };
  }, []);

  function handleMetadata(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
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
    const video = videoElement;
    if (!video) return;

    if (video.paused || video.ended) {
      setUserPausedAutoplaySrc(null);
      video.play().catch(() => {
        setIsPaused(true);
        setControlsVisible(true);
      });
      return;
    }

    if (playerOwnsAutoplay) {
      setUserPausedAutoplaySrc(directSrc ?? null);
    }
    video.pause();
  }

  function toggleMuted(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setMutedState({ prop: resolvedTemplate.muted, src, value: !isMuted });
    revealControls();
  }

  async function requestFullscreen(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = wrapperRef.current;
    const video = videoElement;
    const enterNativeFullscreen = () => {
      if (enterNativeVideoFullscreen(video)) {
        setIsNativeFullscreen(true);
      }
    };
    if (!wrapper) {
      enterNativeFullscreen();
      revealControls();
      return;
    }

    if (isNativeFullscreen) {
      const nativeFullscreenVideo = video as NativeFullscreenVideo | null;
      nativeFullscreenVideo?.webkitExitFullscreen?.();
      setIsNativeFullscreen(false);
      revealControls();
      return;
    }

    if (!isFullscreenEnabled()) {
      enterNativeFullscreen();
      revealControls();
      return;
    }

    if (getFullscreenElement() === wrapper) {
      await exitFullscreen().catch(() => undefined);
      revealControls();
      return;
    }

    const enteredFullscreen = await enterFullscreen(
      wrapper as FullscreenElement
    ).catch(() => false);
    if (!enteredFullscreen) {
      enterNativeFullscreen();
    }
    revealControls();
  }

  function handleVideoClick(event: React.MouseEvent<HTMLVideoElement>) {
    event.preventDefault();
    event.stopPropagation();
    onVideoClick?.(event);
  }

  function openPosterGate(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setOpenPosterGateKey(posterGateKey);
    setUserPausedAutoplaySrc(null);
    const video = videoElement;
    if (!video) {
      return;
    }
    video.play().catch(() => {
      setIsPaused(true);
      setControlsVisible(true);
    });
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
  const posterGateIdentity = poster ?? id ?? dataUrl ?? src ?? "";
  const posterGateKey = `${template}:${posterGateIdentity}`;
  const isPosterGateClosed =
    template === "poster-gated" && openPosterGateKey !== posterGateKey;
  const effectiveControls = isPosterGateClosed
    ? "none"
    : resolvedTemplate.controls;
  const showMinimalControls = effectiveControls === "minimal";
  const videoControls = effectiveControls === "native";
  const playerOwnsAutoplay =
    resolvedTemplate.autoPlay &&
    (resolvedTemplate.mode === "ambient" ||
      resolvedTemplate.mode === "inert-preview");
  const videoAutoPlay =
    resolvedTemplate.autoPlay && !playerOwnsAutoplay && !isPosterGateClosed;
  const isMuted =
    mutedState.src === src &&
    mutedState.prop === resolvedTemplate.muted &&
    typeof mutedState.value === "boolean"
      ? mutedState.value
      : resolvedTemplate.muted;
  const isAnyFullscreen = isFullscreen || isNativeFullscreen;
  const isWrapperFullscreen = isFullscreen;
  const controlsAreVisible = showMinimalControls;
  const responsiveMediaStyle = getResponsiveMediaStyle();
  const directSrc =
    fallbackState.originSrc === src ? (fallbackState.source ?? src) : src;
  const videoSourceProps = directSrc ? { src: directSrc } : {};
  const hasUserPausedOwnedAutoplay = userPausedAutoplaySrc === directSrc;
  const labels = useMemo(
    () => ({
      captions: t(locale, "media.video.captions"),
      download: t(locale, "media.video.download"),
      downloading: t(locale, "media.video.downloading"),
      exitFullscreen: t(locale, "media.video.exitFullscreen"),
      fullscreen: t(locale, "media.video.fullscreen"),
      mute: t(locale, "media.video.mute"),
      pause: t(locale, "media.video.pause"),
      play: t(locale, "media.video.play"),
      playPreview: t(locale, "media.video.playPreview"),
      unmute: t(locale, "media.video.unmute"),
      unsupported: t(locale, "media.video.unsupported"),
    }),
    [locale]
  );
  const resolvedCaptionsLabel = captionsLabel ?? labels.captions;

  const syncOwnedAutoplay = useCallback(() => {
    const video = videoElement;
    if (!video || !playerOwnsAutoplay) {
      return;
    }

    if (!isInView || prefersReducedMotion) {
      video.pause();
      return;
    }
    if (hasUserPausedOwnedAutoplay) {
      return;
    }

    video.play().catch(() => {
      setIsPaused(true);
      setControlsVisible(true);
    });
  }, [
    hasUserPausedOwnedAutoplay,
    isInView,
    playerOwnsAutoplay,
    prefersReducedMotion,
    videoElement,
  ]);

  useEffect(() => {
    // Browser playback is an imperative media side effect of visibility policy.
    syncOwnedAutoplay();
  }, [directSrc, syncOwnedAutoplay]);

  return (
    <div
      ref={setWrapperRef}
      className={clsx(
        "tw-relative tw-max-w-full tw-overflow-hidden tw-rounded-xl tw-bg-transparent tw-outline-none tw-transition",
        showMinimalControls ? "tw-cursor-default" : "tw-cursor-auto",
        widthClassName,
        align === "center" && "tw-mx-auto",
        isFillLayout && "tw-flex tw-items-center tw-justify-center",
        isWrapperFullscreen &&
          "tw-h-screen tw-w-screen tw-rounded-none tw-bg-black",
        className
      )}
      style={responsiveMediaStyle}
    >
      <video
        id={id}
        ref={setVideoRef}
        {...videoSourceProps}
        autoPlay={videoAutoPlay}
        muted={isMuted}
        loop={resolvedTemplate.loop}
        playsInline
        preload={resolvedTemplate.preload}
        poster={poster}
        controls={videoControls}
        aria-label={ariaLabel}
        {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
        onLoadedMetadata={handleMetadata}
        onDurationChange={updateProgress}
        onTimeUpdate={updateProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
        onError={handleError}
        onClick={handleVideoClick}
        className={clsx(
          "tw-block tw-h-full tw-w-full tw-rounded-xl tw-object-contain",
          isWrapperFullscreen && "tw-rounded-none",
          videoClassName
        )}
        data-testid={dataTestId}
        data-mime={dataMime}
        data-url={dataUrl}
        data-disable={dataDisable}
      >
        {captionsSrc && (
          <track
            kind="captions"
            src={captionsSrc}
            srcLang={captionsLang}
            label={resolvedCaptionsLabel}
            default={captionsDefault}
          />
        )}
        {labels.unsupported}
      </video>

      {isPosterGateClosed && (
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-flex tw-items-center tw-justify-center">
          <button
            type="button"
            aria-label={labels.playPreview}
            onClick={openPosterGate}
            className="tw-pointer-events-auto tw-flex tw-size-14 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950/70 tw-p-0 tw-text-white tw-shadow-xl tw-shadow-black/30 tw-backdrop-blur-md tw-transition focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800/90"
          >
            <PlayIcon className="tw-ml-1 tw-size-7" aria-hidden="true" />
          </button>
        </div>
      )}

      {showMinimalControls && (
        <>
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
                label={isMuted ? labels.unmute : labels.mute}
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
                  label={labels.play}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    togglePlayback();
                  }}
                >
                  <PlayIcon
                    className="tw-ml-0.5 tw-size-5"
                    aria-hidden="true"
                  />
                </SeizeVideoControlButton>
              )}
              {!isPaused && (
                <SeizeVideoControlButton
                  label={labels.pause}
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
                  label={isDownloading ? labels.downloading : labels.download}
                  onClick={stopAndRun(onDownload)}
                  disabled={isDownloading}
                >
                  <ArrowDownTrayIcon className="tw-size-5" aria-hidden="true" />
                </SeizeVideoControlButton>
              )}
              {showFullscreen && (
                <SeizeVideoControlButton
                  label={
                    isAnyFullscreen ? labels.exitFullscreen : labels.fullscreen
                  }
                  onClick={requestFullscreen}
                >
                  {isAnyFullscreen ? (
                    <ArrowsPointingInIcon
                      className="tw-size-5"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowsPointingOutIcon
                      className="tw-size-5"
                      aria-hidden="true"
                    />
                  )}
                </SeizeVideoControlButton>
              )}
            </div>
          </div>

          <div
            className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-z-30 tw-h-1 tw-bg-white/20"
            aria-hidden="true"
          >
            <div
              className="tw-h-full tw-bg-primary-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
