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
const DEFAULT_CAPTIONS_LANGUAGE = DEFAULT_LOCALE;

function SeizeVideoControlButton({
  label,
  onClick,
  onFocus,
  children,
  disabled = false,
}: {
  readonly label: string;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus?: (() => void) | undefined;
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
      onFocus={onFocus}
      className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950/70 tw-text-white tw-shadow-lg tw-shadow-black/25 tw-backdrop-blur-md tw-transition tw-duration-200 disabled:tw-cursor-default disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800/90"
    >
      {children}
    </button>
  );
}

interface SeizeVideoLabels {
  readonly captions: string;
  readonly download: string;
  readonly downloading: string;
  readonly exitFullscreen: string;
  readonly fullscreen: string;
  readonly mute: string;
  readonly pause: string;
  readonly play: string;
  readonly player: string;
  readonly playPreview: string;
  readonly unmute: string;
  readonly unsupported: string;
}

function SeizeVideoMinimalControls({
  isAnyFullscreen,
  isDownloading,
  isMuted,
  isPaused,
  labels,
  onControlsFocus,
  onDownloadClick,
  onFullscreenClick,
  onMuteClick,
  onOpenClick,
  onPlaybackClick,
  openLabel,
  progress,
  showControls,
  showActions,
  showFullscreen,
}: {
  readonly isAnyFullscreen: boolean;
  readonly isDownloading: boolean;
  readonly isMuted: boolean;
  readonly isPaused: boolean;
  readonly labels: SeizeVideoLabels;
  readonly onControlsFocus: () => void;
  readonly onDownloadClick?:
    | ((event: React.MouseEvent<HTMLButtonElement>) => void)
    | undefined;
  readonly onFullscreenClick: (
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
  readonly onMuteClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly onOpenClick?:
    | ((event: React.MouseEvent<HTMLButtonElement>) => void)
    | undefined;
  readonly onPlaybackClick: (
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
  readonly openLabel?: string | undefined;
  readonly progress: number;
  readonly showControls: boolean;
  readonly showActions: boolean;
  readonly showFullscreen: boolean;
}) {
  return (
    <>
      <div
        className={clsx(
          "tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-transition-opacity tw-duration-200",
          showControls ? "tw-opacity-100" : "tw-opacity-0"
        )}
      >
        {isPaused && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            <button
              type="button"
              aria-label={labels.play}
              title={labels.play}
              onClick={onPlaybackClick}
              onFocus={onControlsFocus}
              className="tw-pointer-events-auto tw-flex tw-size-16 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950/65 tw-p-0 tw-text-white tw-shadow-xl tw-shadow-black/30 tw-backdrop-blur-md tw-transition focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800/90"
            >
              <PlayIcon className="tw-ml-1 tw-size-8" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="tw-pointer-events-auto tw-absolute tw-bottom-4 tw-left-3">
          <SeizeVideoControlButton
            label={isMuted ? labels.unmute : labels.mute}
            onClick={onMuteClick}
            onFocus={onControlsFocus}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="tw-size-5" aria-hidden="true" />
            ) : (
              <SpeakerWaveIcon className="tw-size-5" aria-hidden="true" />
            )}
          </SeizeVideoControlButton>
        </div>

        <div className="tw-pointer-events-auto tw-absolute tw-bottom-4 tw-right-3 tw-flex tw-items-center tw-gap-2">
          {!isPaused && (
            <SeizeVideoControlButton
              label={labels.pause}
              onClick={onPlaybackClick}
              onFocus={onControlsFocus}
            >
              <PauseIcon className="tw-size-5" aria-hidden="true" />
            </SeizeVideoControlButton>
          )}
          {showActions && onOpenClick && openLabel && (
            <SeizeVideoControlButton
              label={openLabel}
              onClick={onOpenClick}
              onFocus={onControlsFocus}
            >
              <ArrowTopRightOnSquareIcon
                className="tw-size-5"
                aria-hidden="true"
              />
            </SeizeVideoControlButton>
          )}
          {showActions && onDownloadClick && (
            <SeizeVideoControlButton
              label={isDownloading ? labels.downloading : labels.download}
              onClick={onDownloadClick}
              onFocus={onControlsFocus}
              disabled={isDownloading}
            >
              <ArrowDownTrayIcon className="tw-size-5" aria-hidden="true" />
            </SeizeVideoControlButton>
          )}
          {showFullscreen && (
            <SeizeVideoControlButton
              label={isAnyFullscreen ? labels.exitFullscreen : labels.fullscreen}
              onClick={onFullscreenClick}
              onFocus={onControlsFocus}
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
  );
}

function SeizeVideoElement({
  ariaLabel,
  captionsDefault,
  captionsLabel,
  captionsLang,
  captionsSrc,
  dataDisable,
  dataMime,
  dataTestId,
  dataUrl,
  id,
  isMuted,
  isWrapperFullscreen,
  labels,
  loop,
  onClick,
  onDurationChange,
  onEnded,
  onError,
  onLoadedMetadata,
  onPause,
  onPlay,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onTimeUpdate,
  onTouchStart,
  poster,
  preload,
  setVideoRef,
  src,
  videoAutoPlay,
  videoClassName,
  videoControls,
}: {
  readonly ariaLabel: string;
  readonly captionsDefault: boolean;
  readonly captionsLabel: string;
  readonly captionsLang: string;
  readonly captionsSrc?: string | undefined;
  readonly dataDisable?: string | undefined;
  readonly dataMime?: string | undefined;
  readonly dataTestId?: string | undefined;
  readonly dataUrl?: string | undefined;
  readonly id?: string | undefined;
  readonly isMuted: boolean;
  readonly isWrapperFullscreen: boolean;
  readonly labels: SeizeVideoLabels;
  readonly loop: boolean;
  readonly onClick: React.MouseEventHandler<HTMLVideoElement>;
  readonly onDurationChange: () => void;
  readonly onEnded: () => void;
  readonly onError: React.ReactEventHandler<HTMLVideoElement>;
  readonly onLoadedMetadata: React.ReactEventHandler<HTMLVideoElement>;
  readonly onPause: () => void;
  readonly onPlay: () => void;
  readonly onPointerEnter?: (() => void) | undefined;
  readonly onPointerLeave?: (() => void) | undefined;
  readonly onPointerMove?: (() => void) | undefined;
  readonly onTimeUpdate: () => void;
  readonly onTouchStart?: (() => void) | undefined;
  readonly poster?: string | undefined;
  readonly preload: "auto" | "metadata" | "none";
  readonly setVideoRef: (element: HTMLVideoElement | null) => void;
  readonly src?: string | undefined;
  readonly videoAutoPlay: boolean;
  readonly videoClassName?: string | undefined;
  readonly videoControls: boolean;
}) {
  return (
    <>
      {/* NOSONAR: render captions only when a real VTT source exists. */}<video
        id={id}
        ref={setVideoRef}
        src={src}
        autoPlay={videoAutoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        preload={preload}
        poster={poster}
        controls={videoControls}
        aria-label={ariaLabel}
        {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onDurationChange}
        onTimeUpdate={onTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onTouchStart={onTouchStart}
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
            label={captionsLabel}
            default={captionsDefault}
          />
        )}
        {labels.unsupported}
      </video>
    </>
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
  captionsLang = DEFAULT_CAPTIONS_LANGUAGE,
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
  const [controlsVisible, setControlsVisible] = useState(true);
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
    () =>
      globalThis.window === undefined ? undefined : globalThis.window.innerHeight
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
      globalThis.window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }

  function hideControlsSoon() {
    if (effectiveControls !== "minimal" || globalThis.window === undefined) {
      return;
    }
    clearHideControlsTimer();
    hideControlsTimerRef.current = globalThis.window.setTimeout(() => {
      const video = videoElement;
      if (video && !video.paused && !isAnyFullscreen) {
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
      globalThis.window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function startProgressAnimation() {
    stopProgressAnimation();
    const tick = () => {
      updateProgress();
      const video = videoElement;
      if (video && !video.paused && !video.ended) {
        animationFrameRef.current = globalThis.window.requestAnimationFrame(tick);
      }
    };
    animationFrameRef.current = globalThis.window.requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const updateViewportHeight = () => {
      setViewportHeight(globalThis.window.innerHeight);
    };
    globalThis.window.addEventListener("resize", updateViewportHeight);
    return () => {
      globalThis.window.removeEventListener("resize", updateViewportHeight);
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
  const controlsAreVisible = controlsVisible || isPaused || isAnyFullscreen;
  const responsiveMediaStyle = getResponsiveMediaStyle();
  const directSrc =
    fallbackState.originSrc === src ? (fallbackState.source ?? src) : src;
  const hasUserPausedOwnedAutoplay = userPausedAutoplaySrc === directSrc;
  const labels = useMemo<SeizeVideoLabels>(
    () => ({
      captions: t(locale, "media.video.captions"),
      download: t(locale, "media.video.download"),
      downloading: t(locale, "media.video.downloading"),
      exitFullscreen: t(locale, "media.video.exitFullscreen"),
      fullscreen: t(locale, "media.video.fullscreen"),
      mute: t(locale, "media.video.mute"),
      pause: t(locale, "media.video.pause"),
      play: t(locale, "media.video.play"),
      player: t(locale, "media.video.player"),
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
      <SeizeVideoElement
        ariaLabel={ariaLabel ?? labels.player}
        captionsDefault={captionsDefault}
        captionsLabel={resolvedCaptionsLabel}
        captionsLang={captionsLang}
        captionsSrc={captionsSrc}
        dataDisable={dataDisable}
        dataMime={dataMime}
        dataTestId={dataTestId}
        dataUrl={dataUrl}
        id={id}
        isMuted={isMuted}
        isWrapperFullscreen={isWrapperFullscreen}
        labels={labels}
        loop={resolvedTemplate.loop}
        onClick={handleVideoClick}
        onDurationChange={updateProgress}
        onEnded={handlePause}
        onError={handleError}
        onLoadedMetadata={handleMetadata}
        onPause={handlePause}
        onPlay={handlePlay}
        onPointerEnter={showMinimalControls ? revealControls : undefined}
        onPointerLeave={showMinimalControls ? hideControlsSoon : undefined}
        onPointerMove={showMinimalControls ? revealControls : undefined}
        onTimeUpdate={updateProgress}
        onTouchStart={showMinimalControls ? revealControls : undefined}
        poster={poster}
        preload={resolvedTemplate.preload}
        setVideoRef={setVideoRef}
        src={directSrc}
        videoAutoPlay={videoAutoPlay}
        videoClassName={videoClassName}
        videoControls={videoControls}
      />

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
        <SeizeVideoMinimalControls
          isAnyFullscreen={isAnyFullscreen}
          isDownloading={isDownloading}
          isMuted={isMuted}
          isPaused={isPaused}
          labels={labels}
          onControlsFocus={revealControls}
          onDownloadClick={onDownload ? stopAndRun(onDownload) : undefined}
          onFullscreenClick={requestFullscreen}
          onMuteClick={toggleMuted}
          onOpenClick={onOpen ? stopAndRun(onOpen) : undefined}
          onPlaybackClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            togglePlayback();
            revealControls();
          }}
          openLabel={openLabel}
          progress={progress}
          showControls={controlsAreVisible}
          showActions={showActions}
          showFullscreen={showFullscreen}
        />
      )}
    </div>
  );
}
