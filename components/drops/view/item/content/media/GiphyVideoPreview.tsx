"use client";

import { usePrefersReducedMotion } from "./SeizeVideoPlayer.config";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";

const RESERVED_ASPECT_RATIO = "16 / 9";
const NATURAL_MAX_HEIGHT = "16rem";

// While playing (or before the first frame), the control stays out of the way
// on hover-capable devices until the media is hovered or keyboard focus enters
// it; touch devices (and hybrids that report no fine hover) always show it.
const AUTO_HIDE_CLASS =
  "desktop-hover:tw-pointer-events-none desktop-hover:tw-opacity-0 desktop-hover:tw-transition-opacity desktop-hover:tw-duration-200 desktop-hover:group-hover/media:tw-pointer-events-auto desktop-hover:group-hover/media:tw-opacity-100 group-focus-within/media:tw-pointer-events-auto group-focus-within/media:tw-opacity-100 touch-only:tw-pointer-events-auto touch-only:tw-opacity-100 motion-reduce:tw-transition-none";

type GiphyVideoPreviewProps = {
  readonly videoRef: RefObject<HTMLVideoElement | null>;
  readonly videoSrc: string;
  readonly posterSrc: string;
  readonly alt: string;
  readonly fillContainer: boolean;
  readonly objectPosition: string;
  readonly onLoad: () => void;
  readonly onError: () => void;
  readonly onPlayingChange: (playing: boolean) => void;
};

/**
 * Plays a Giphy GIF from its MP4 rendition: muted, looping and inline, like
 * the GIF, at a fraction of the bytes. Viewers who prefer reduced motion get
 * the still frame and start playback themselves.
 */
export function GiphyVideoPreview({
  videoRef,
  videoSrc,
  posterSrc,
  alt,
  fillContainer,
  objectPosition,
  onLoad,
  onError,
  onPlayingChange,
}: GiphyVideoPreviewProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();

  // A changed motion preference remounts the element, and the element it
  // drops sends no pause event; the fresh one starts paused.
  useEffect(() => {
    onPlayingChange(false);
  }, [prefersReducedMotion, onPlayingChange]);

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const { videoHeight, videoWidth } = event.currentTarget;
      if (videoHeight > 0 && videoWidth > 0) {
        setAspectRatio(`${videoWidth} / ${videoHeight}`);
      }
      onLoad();
    },
    [onLoad]
  );

  return (
    <span
      className={
        fillContainer
          ? "tw-relative tw-block tw-h-full tw-w-full tw-overflow-hidden"
          : "tw-relative tw-block tw-min-h-40 tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-xl"
      }
      style={
        fillContainer
          ? undefined
          : {
              aspectRatio: aspectRatio ?? RESERVED_ASPECT_RATIO,
              maxHeight: NATURAL_MAX_HEIGHT,
            }
      }
    >
      <video
        // A changed motion preference (including the first client render
        // after hydration) remounts the element instead of leaving it playing.
        key={prefersReducedMotion ? "still" : "autoplay"}
        ref={videoRef}
        src={videoSrc}
        aria-label={alt}
        autoPlay={!prefersReducedMotion}
        muted
        loop
        playsInline
        disablePictureInPicture
        preload={prefersReducedMotion ? "metadata" : "auto"}
        poster={prefersReducedMotion ? posterSrc : undefined}
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-contain"
        style={{ objectPosition }}
        onLoadedMetadata={handleLoadedMetadata}
        onError={onError}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
      />
    </span>
  );
}

/**
 * Pauses and resumes the animation (WCAG 2.2.2). It is mounted with the video,
 * so no motion can play without it.
 */
export function GiphyPlaybackToggle({
  videoRef,
  playing,
  autoHide,
}: {
  readonly videoRef: RefObject<HTMLVideoElement | null>;
  readonly playing: boolean;
  readonly autoHide: boolean;
}) {
  const label = t(
    DEFAULT_LOCALE,
    playing ? "drop.media.pauseAnimation" : "drop.media.playAnimation"
  );
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={handleClick}
      className={clsx(
        "tw-pointer-events-auto tw-absolute tw-bottom-[5px] tw-left-[5px] tw-z-30 tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-950/90 tw-p-0 tw-text-iron-100 tw-shadow-lg tw-shadow-black/20 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-backdrop-blur focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white desktop-hover:hover:tw-bg-iron-700",
        autoHide && AUTO_HIDE_CLASS
      )}
    >
      {playing ? (
        <PauseIcon className="tw-size-4" aria-hidden="true" />
      ) : (
        <PlayIcon className="tw-size-4" aria-hidden="true" />
      )}
    </button>
  );
}
