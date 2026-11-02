"use client";

import {
  DropImagePreview,
  getDropImagePreviewSources,
  getGiphyVideoPreviewSources,
} from "./DropImagePreview";
import { GiphyPlaybackToggle, GiphyVideoPreview } from "./GiphyVideoPreview";
import Button from "@/components/utils/button/Button";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Image from "next/image";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { ImageScale } from "@/helpers/image.helpers";
import { isGifImageUrl } from "@/helpers/gif-preview.helpers";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { ExpandedMediaToolbar } from "./MediaActionToolbar";
import { ImageQualityToggle } from "./ImageQualityToggle";
import {
  useOriginalImage,
  type OriginalImageQuality,
} from "./useOriginalImage";

type ExpandedMediaElement = HTMLImageElement | HTMLVideoElement;
type GiphyVideoSources = NonNullable<
  ReturnType<typeof getGiphyVideoPreviewSources>
>;

const EXPANDED_MEDIA_STYLE: React.CSSProperties = {
  objectFit: "contain",
  objectPosition: "center",
  pointerEvents: "auto",
};

export function requestCenteredImageFullscreen(
  fullscreenTarget: HTMLImageElement | HTMLVideoElement
) {
  const previousObjectPosition = fullscreenTarget.style.objectPosition;

  fullscreenTarget.style.objectPosition = "center";

  const restoreInlinePosition = () => {
    if (document.fullscreenElement === fullscreenTarget) {
      return;
    }

    fullscreenTarget.style.objectPosition = previousObjectPosition;
    document.removeEventListener("fullscreenchange", restoreInlinePosition);
  };

  document.addEventListener("fullscreenchange", restoreInlinePosition);
  fullscreenTarget.requestFullscreen().catch(() => {
    document.removeEventListener("fullscreenchange", restoreInlinePosition);
    fullscreenTarget.style.objectPosition = previousObjectPosition;
  });
}

function getIntrinsicSize(media: ExpandedMediaElement) {
  return media instanceof HTMLVideoElement
    ? { width: media.videoWidth, height: media.videoHeight }
    : { width: media.naturalWidth, height: media.naturalHeight };
}

function isPointInsideRenderedMedia(
  media: ExpandedMediaElement,
  clientX: number,
  clientY: number
) {
  const rect = media.getBoundingClientRect();
  const { width: naturalWidth, height: naturalHeight } =
    getIntrinsicSize(media);

  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return true;
  }

  const imageAspectRatio = naturalWidth / naturalHeight;
  const containerAspectRatio = rect.width / rect.height;
  const renderedWidth =
    imageAspectRatio > containerAspectRatio
      ? rect.width
      : rect.height * imageAspectRatio;
  const renderedHeight =
    imageAspectRatio > containerAspectRatio
      ? rect.width / imageAspectRatio
      : rect.height;
  const renderedLeft = rect.left + (rect.width - renderedWidth) / 2;
  const renderedTop = rect.top + (rect.height - renderedHeight) / 2;

  return (
    clientX >= renderedLeft &&
    clientX <= renderedLeft + renderedWidth &&
    clientY >= renderedTop &&
    clientY <= renderedTop + renderedHeight
  );
}

// Giphy GIFs play from Giphy's MP4 rendition, like the inline preview, until
// the video fails; every other image keeps the optimized preview.
function getExpandedGiphyVideo(src: string, failedVideoSource: string | null) {
  return failedVideoSource === src ? null : getGiphyVideoPreviewSources(src);
}

function ExpandedGiphyVideo({
  sources,
  videoRef,
  alt,
  onError,
  onPlayingChange,
}: {
  readonly sources: GiphyVideoSources;
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly alt: string;
  readonly onError: () => void;
  readonly onPlayingChange: (playing: boolean) => void;
}) {
  return (
    <span className="tw-absolute tw-inset-0">
      <GiphyVideoPreview
        videoRef={videoRef}
        videoSrc={sources.videoSrc}
        posterSrc={sources.posterSrc}
        alt={alt}
        fillContainer
        objectPosition="center"
        // Sync with the element in case playback began before this listener.
        onLoad={() =>
          onPlayingChange(videoRef.current ? !videoRef.current.paused : false)
        }
        onError={onError}
        onPlayingChange={onPlayingChange}
      />
    </span>
  );
}

export function ImageMediaModal({
  src,
  imageRef,
  onClose,
  onOpen,
  openLabel,
  onDownload,
  isDownloading,
  onFullscreen,
  fullscreenTargetAvailable = true,
  gallery,
  originalQuality,
  preferHighQualityPreview = false,
  onAnimatedPreviewUnavailable,
  videoAlt,
}: {
  readonly src: string;
  readonly imageRef: React.RefObject<HTMLImageElement | null>;
  readonly onClose: () => void;
  readonly onOpen?: (() => void) | undefined;
  readonly openLabel?: string | undefined;
  readonly onDownload: () => void;
  readonly isDownloading: boolean;
  readonly onFullscreen: () => void;
  readonly fullscreenTargetAvailable?: boolean | undefined;
  readonly originalQuality?: OriginalImageQuality | undefined;
  readonly preferHighQualityPreview?: boolean | undefined;
  readonly onAnimatedPreviewUnavailable?: (() => void) | undefined;
  // A caller's description names the expanded Giphy video.
  readonly videoAlt?: string | undefined;
  readonly gallery?:
    | {
        readonly canGoNext: boolean;
        readonly canGoPrevious: boolean;
        readonly currentIndex: number;
        readonly onNext: () => void;
        readonly onPrevious: () => void;
        readonly total: number;
      }
    | undefined;
}) {
  const localOriginalQuality = useOriginalImage(src);
  const quality = originalQuality ?? localOriginalQuality;
  const originalRequested = quality.requested;
  const playingOriginal = quality.showingOriginal;
  const isGif = isGifImageUrl(src);
  const loadingOriginalLabel = t(
    DEFAULT_LOCALE,
    isGif ? "drop.media.loadingOriginalGif" : "drop.media.loadingOriginalImage"
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [failedVideoSource, setFailedVideoSource] = useState<string | null>(
    null
  );
  const [zoomState, setZoomState] = useState({ src, isZoomed: false });
  if (zoomState.src !== src) {
    setZoomState({ src, isZoomed: false });
    setVideoPlaying(false);
  }
  const isZoomed = zoomState.src === src && zoomState.isZoomed;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const giphyVideo = getExpandedGiphyVideo(src, failedVideoSource);
  // An original the viewer asked for replaces the video once it loads.
  const showsVideo = giphyVideo !== null && !playingOriginal;
  const previewUnavailable =
    giphyVideo === null &&
    (failedSource === src ||
      getDropImagePreviewSources(src, ImageScale.AUTOx1080).length === 0);
  const showGalleryControls = Boolean(gallery && gallery.total > 1);

  const goToPrevious = useCallback(() => {
    if (gallery?.canGoPrevious) {
      gallery.onPrevious();
    }
  }, [gallery]);

  const goToNext = useCallback(() => {
    if (gallery?.canGoNext) {
      gallery.onNext();
    }
  }, [gallery]);

  useKeyPressEvent("Escape", onClose);
  useKeyPressEvent("ArrowLeft", goToPrevious);
  useKeyPressEvent("ArrowRight", goToNext);

  // A failed MP4 rendition falls back to the existing GIF preview.
  const handleVideoError = () => {
    setFailedVideoSource(src);
    setVideoPlaying(false);
  };

  const retryPreview = () => {
    setFailedSource(null);
    setFailedVideoSource(null);
    setVideoPlaying(false);
    setRetry((value) => value + 1);
  };

  // The video is the expanded media, so it is what goes full screen; callers
  // only know the image elements they passed in.
  const handleFullscreen = () => {
    const video = showsVideo ? videoRef.current : null;
    if (video) {
      requestCenteredImageFullscreen(video);
      return;
    }
    onFullscreen();
  };

  const handleExpandedImageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    const media = showsVideo ? videoRef.current : imageRef.current;
    if (!media || event.detail === 0) {
      onClose();
      return;
    }

    if (!isPointInsideRenderedMedia(media, event.clientX, event.clientY)) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="tailwind-scope tw-relative tw-z-[1100] tw-cursor-default"
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close modal"
        data-testid="modal-backdrop"
        onClick={onClose}
        className="tw-fixed tw-inset-0 tw-z-1000 tw-border-0 tw-bg-black/80 tw-p-0"
      />
      <TransformWrapper
        key={src}
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(event) =>
          setZoomState({ src, isZoomed: event.state.scale > 1 })
        }
      >
        {() => (
          <div className="tw-pointer-events-none tw-fixed tw-inset-0 tw-z-[1001] tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
            <div className="tw-pointer-events-auto tw-relative tw-flex tw-h-[90dvh] tw-w-[95vw] tw-flex-col">
              <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center">
                <TransformComponent
                  wrapperClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  contentClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  wrapperStyle={{ width: "95vw", height: "90dvh" }}
                  contentStyle={{ width: "95vw", height: "90dvh" }}
                >
                  <button
                    type="button"
                    aria-label="Close modal"
                    className="tw-relative tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-p-0"
                    onClick={handleExpandedImageButtonClick}
                  >
                    {/* Drop media can come from arbitrary hosts outside Next image config. */}
                    {originalRequested && (
                      <Image
                        key={`original-${src}`}
                        ref={playingOriginal ? imageRef : null}
                        src={resolveIpfsUrlSync(src)}
                        alt={t(
                          DEFAULT_LOCALE,
                          isGif
                            ? "drop.media.originalGifAlt"
                            : "drop.media.originalImageAlt"
                        )}
                        fill
                        sizes="95vw"
                        unoptimized
                        loading="eager"
                        hidden={!playingOriginal}
                        onLoad={quality.onLoad}
                        onError={quality.onError}
                        style={EXPANDED_MEDIA_STYLE}
                      />
                    )}
                    {showsVideo && (
                      <ExpandedGiphyVideo
                        key={`${src}:${retry}`}
                        sources={giphyVideo}
                        videoRef={videoRef}
                        alt={
                          videoAlt ??
                          t(
                            DEFAULT_LOCALE,
                            "drop.media.expandedGifAnimationAlt"
                          )
                        }
                        onError={handleVideoError}
                        onPlayingChange={setVideoPlaying}
                      />
                    )}
                    {giphyVideo === null && (
                      <span
                        className="tw-absolute tw-inset-0"
                        hidden={playingOriginal}
                      >
                        <DropImagePreview
                          key={`${src}:${retry}`}
                          ref={playingOriginal ? null : imageRef}
                          onError={() => setFailedSource(src)}
                          onLoad={() => setFailedSource(null)}
                          originalSrc={src}
                          imageScale={ImageScale.AUTOx1080}
                          preferHighQuality={preferHighQualityPreview}
                          onAnimatedPreviewUnavailable={
                            onAnimatedPreviewUnavailable
                          }
                          alt={t(DEFAULT_LOCALE, "drop.media.previewAlt")}
                          fill
                          sizes="95vw"
                          style={EXPANDED_MEDIA_STYLE}
                        />
                      </span>
                    )}
                  </button>
                </TransformComponent>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
      {showsVideo && (
        <GiphyPlaybackToggle
          videoRef={videoRef}
          playing={videoPlaying}
          autoHide={false}
          placement="expanded"
        />
      )}
      {quality.loading && (
        <output
          aria-label={loadingOriginalLabel}
          className="tw-pointer-events-none tw-fixed tw-left-1/2 tw-top-1/2 tw-z-[1101] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-black/60 tw-p-3"
        >
          <span className="tw-sr-only">{loadingOriginalLabel}</span>
          <span
            aria-hidden="true"
            className="tw-block tw-size-6 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-100/30 tw-border-t-iron-100 motion-safe:tw-animate-spin"
          />
        </output>
      )}
      {!playingOriginal && previewUnavailable && (
        <div className="tw-fixed tw-bottom-20 tw-left-1/2 tw-z-[1102] -tw-translate-x-1/2">
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={retryPreview}
          >
            {t(DEFAULT_LOCALE, "drop.media.retryPreview")}
          </Button>
        </div>
      )}
      {showGalleryControls && gallery && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            title="Previous image"
            disabled={!gallery.canGoPrevious}
            onClick={(event) => {
              event.stopPropagation();
              goToPrevious();
            }}
            className="tw-fixed tw-left-3 tw-top-1/2 tw-z-[1101] tw-inline-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-bg-iron-900/95 tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur tw-transition tw-duration-200 disabled:tw-cursor-default disabled:tw-opacity-40 desktop-hover:hover:tw-bg-iron-700 sm:tw-left-4 sm:tw-size-12"
          >
            <ChevronLeftIcon className="tw-size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            title="Next image"
            disabled={!gallery.canGoNext}
            onClick={(event) => {
              event.stopPropagation();
              goToNext();
            }}
            className="tw-fixed tw-right-3 tw-top-1/2 tw-z-[1101] tw-inline-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-bg-iron-900/95 tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur tw-transition tw-duration-200 disabled:tw-cursor-default disabled:tw-opacity-40 desktop-hover:hover:tw-bg-iron-700 sm:tw-right-4 sm:tw-size-12"
          >
            <ChevronRightIcon className="tw-size-6" aria-hidden="true" />
          </button>
          <div
            className="tw-fixed tw-left-1/2 tw-z-[1101] -tw-translate-x-1/2 tw-rounded-lg tw-bg-iron-900/95 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur"
            data-testid="image-gallery-counter"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            {gallery.currentIndex + 1} / {gallery.total}
          </div>
        </>
      )}
      <ExpandedMediaToolbar
        onOpen={onOpen}
        openLabel={openLabel}
        onDownload={onDownload}
        isDownloading={isDownloading}
        onFullscreen={handleFullscreen}
        fullscreenTargetAvailable={
          fullscreenTargetAvailable && (playingOriginal || !previewUnavailable)
        }
        onClose={onClose}
      >
        {quality.canViewOriginal && (
          <ImageQualityToggle
            showingOriginal={originalRequested}
            failed={quality.failed}
            isGif={isGif}
            onToggle={quality.toggle}
          />
        )}
      </ExpandedMediaToolbar>
    </div>,
    document.body
  );
}
