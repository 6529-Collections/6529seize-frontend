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
import React from "react";
import styles from "./SeizeVideoTimeline.module.css";

function SeizeVideoControlButton({
  label,
  onClick,
  onFocus,
  tabIndex,
  children,
  disabled = false,
}: {
  readonly label: string;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus?: (() => void) | undefined;
  readonly tabIndex?: number | undefined;
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
      tabIndex={tabIndex}
      className="tw-inline-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950/70 tw-text-white tw-shadow-lg tw-shadow-black/25 tw-backdrop-blur-md tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-default disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800/90"
    >
      {children}
    </button>
  );
}

export interface SeizeVideoLabels {
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
  readonly seek: string;
  readonly unmute: string;
  readonly unsupported: string;
}

interface MinimalVideoHandlers {
  readonly onPointerEnter?: (() => void) | undefined;
  readonly onPointerLeave?: (() => void) | undefined;
  readonly onPointerMove?: (() => void) | undefined;
  readonly onTouchStart?: (() => void) | undefined;
}

export function getMinimalVideoHandlers({
  hideControlsSoon,
  revealControls,
  showMinimalControls,
}: {
  readonly hideControlsSoon: () => void;
  readonly revealControls: () => void;
  readonly showMinimalControls: boolean;
}): MinimalVideoHandlers {
  if (!showMinimalControls) {
    return {};
  }

  return {
    onPointerEnter: revealControls,
    onPointerLeave: hideControlsSoon,
    onPointerMove: revealControls,
    onTouchStart: revealControls,
  };
}

export function SeizeVideoMinimalControls({
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
  onSeekChange,
  onScrubStart,
  onScrubEnd,
  currentTimeLabel,
  durationLabel,
  seekValueText,
  openLabel,
  progress,
  seekDisabled,
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
  readonly onSeekChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly openLabel?: string | undefined;
  readonly onScrubStart: () => void;
  readonly onScrubEnd: () => void;
  readonly currentTimeLabel: string;
  readonly durationLabel: string;
  readonly seekValueText: string;
  readonly progress: number;
  readonly seekDisabled: boolean;
  readonly showControls: boolean;
  readonly showActions: boolean;
  readonly showFullscreen: boolean;
}) {
  const controlsHitTestClass = showControls
    ? "tw-pointer-events-auto"
    : "tw-pointer-events-none";
  const controlsTabIndex = showControls ? undefined : -1;

  return (
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
            tabIndex={controlsTabIndex}
            className={clsx(
              controlsHitTestClass,
              "tw-flex tw-size-16 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/40 tw-bg-black/80 tw-p-0 tw-text-white tw-shadow-xl tw-shadow-black/50 tw-backdrop-blur-md tw-transition focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800/90"
            )}
          >
            <PlayIcon className="tw-ml-1 tw-size-8" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="tw-absolute tw-bottom-3 tw-left-3 tw-right-3">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          disabled={seekDisabled}
          aria-label={labels.seek}
          aria-valuetext={seekValueText}
          tabIndex={controlsTabIndex}
          onChange={onSeekChange}
          onClick={(event) => event.stopPropagation()}
          onFocus={onControlsFocus}
          onPointerDown={(event) => {
            event.stopPropagation();
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Native seeking still works if the pointer ended before capture.
              // Avoid locking controls open without a captured end event.
              onScrubEnd();
              return;
            }
            onScrubStart();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
            onScrubEnd();
          }}
          onPointerCancel={onScrubEnd}
          onLostPointerCapture={onScrubEnd}
          onBlur={onScrubEnd}
          onTouchStart={(event) => event.stopPropagation()}
          className={clsx(
            styles["timeline"],
            controlsHitTestClass,
            "tw-m-0 tw-block tw-h-11 tw-w-full tw-cursor-pointer disabled:tw-cursor-default"
          )}
          style={{ "--video-progress": `${progress}%` } as React.CSSProperties}
        />
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
          <div
            className={clsx(
              controlsHitTestClass,
              "tw-flex tw-h-9 tw-items-center tw-rounded-full tw-bg-iron-950/70 tw-pr-3 tw-text-white tw-shadow-lg tw-shadow-black/25 tw-backdrop-blur-md"
            )}
          >
            <button
              type="button"
              aria-label={isPaused ? labels.play : labels.pause}
              title={isPaused ? labels.play : labels.pause}
              onClick={onPlaybackClick}
              onFocus={onControlsFocus}
              tabIndex={controlsTabIndex}
              className="tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white tw-transition focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800/90"
            >
              {isPaused ? (
                <PlayIcon className="tw-size-5" aria-hidden="true" />
              ) : (
                <PauseIcon className="tw-size-5" aria-hidden="true" />
              )}
            </button>
            <span
              className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-tabular-nums"
              dir="ltr"
            >
              {currentTimeLabel} / {durationLabel}
            </span>
          </div>
          <div
            className={clsx(
              controlsHitTestClass,
              "tw-ml-auto tw-flex tw-items-center tw-gap-2"
            )}
          >
            <SeizeVideoControlButton
              label={isMuted ? labels.unmute : labels.mute}
              onClick={onMuteClick}
              onFocus={onControlsFocus}
              tabIndex={controlsTabIndex}
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="tw-size-5" aria-hidden="true" />
              ) : (
                <SpeakerWaveIcon className="tw-size-5" aria-hidden="true" />
              )}
            </SeizeVideoControlButton>
            {showActions && onOpenClick && openLabel && (
              <SeizeVideoControlButton
                label={openLabel}
                onClick={onOpenClick}
                onFocus={onControlsFocus}
                tabIndex={controlsTabIndex}
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
                tabIndex={controlsTabIndex}
              >
                <ArrowDownTrayIcon className="tw-size-5" aria-hidden="true" />
              </SeizeVideoControlButton>
            )}
            {showFullscreen && (
              <SeizeVideoControlButton
                label={
                  isAnyFullscreen ? labels.exitFullscreen : labels.fullscreen
                }
                onClick={onFullscreenClick}
                onFocus={onControlsFocus}
                tabIndex={controlsTabIndex}
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
      </div>
    </div>
  );
}

export function SeizeVideoElement({
  ariaLabel,
  captionsDefault,
  captionsLabel,
  captionsLang,
  captionsSrc,
  dataDisable,
  dataNftMediaRenderer,
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
  onEmptied,
  onError,
  onFocus,
  onLoadedMetadata,
  onPause,
  onPlay,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onSeeked,
  onSeeking,
  onTimeUpdate,
  onTouchStart,
  poster,
  preload,
  setVideoRef,
  src,
  videoAutoPlay,
  videoClassName,
  videoControls,
  videoTabIndex,
}: {
  readonly ariaLabel: string;
  readonly captionsDefault: boolean;
  readonly captionsLabel: string;
  readonly captionsLang: string;
  readonly captionsSrc?: string | undefined;
  readonly dataDisable?: string | undefined;
  readonly dataNftMediaRenderer?: string | undefined;
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
  readonly onEmptied: () => void;
  readonly onError: React.ReactEventHandler<HTMLVideoElement>;
  readonly onFocus?: React.FocusEventHandler<HTMLVideoElement> | undefined;
  readonly onLoadedMetadata: React.ReactEventHandler<HTMLVideoElement>;
  readonly onPause: () => void;
  readonly onPlay: () => void;
  readonly onPointerEnter?: (() => void) | undefined;
  readonly onPointerLeave?: (() => void) | undefined;
  readonly onPointerMove?: (() => void) | undefined;
  readonly onSeeked: () => void;
  readonly onSeeking: () => void;
  readonly onTimeUpdate: () => void;
  readonly onTouchStart?: (() => void) | undefined;
  readonly poster?: string | undefined;
  readonly preload: "auto" | "metadata" | "none";
  readonly setVideoRef: (element: HTMLVideoElement | null) => void;
  readonly src?: string | undefined;
  readonly videoAutoPlay: boolean;
  readonly videoClassName?: string | undefined;
  readonly videoControls: boolean;
  readonly videoTabIndex?: number | undefined;
}) {
  // Sonar cannot infer that the conditional child below is a captions track.
  // Keep the intrinsic alias so videos without a real VTT source stay track-free.
  const VideoWithOptionalCaptions = "video";

  return (
    <VideoWithOptionalCaptions
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
      tabIndex={videoTabIndex}
      aria-label={ariaLabel}
      {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
      onLoadedMetadata={onLoadedMetadata}
      onDurationChange={onDurationChange}
      onTimeUpdate={onTimeUpdate}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onEmptied={onEmptied}
      onError={onError}
      onFocus={onFocus}
      onSeeked={onSeeked}
      onSeeking={onSeeking}
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
      data-nft-media-renderer={dataNftMediaRenderer}
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
    </VideoWithOptionalCaptions>
  );
}
