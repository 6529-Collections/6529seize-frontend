"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import {
  ImageMediaModal,
  requestCenteredImageFullscreen,
} from "@/components/drops/view/item/content/media/ImageMediaModal";
import { InlineMediaActions } from "@/components/drops/view/item/content/media/MediaActionToolbar";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import { useDropImageGallery } from "@/components/drops/view/part/DropImageGalleryProvider";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React, { useCallback, useEffect, useRef, useState } from "react";

const AUTO_RETRY_DELAY_MS = 1500;
const MAX_AUTO_RETRY_ATTEMPTS = 40;
const IMAGE_RETRY_QUERY_PARAM = "drop_media_retry";

function withRetryCacheBust(src: string, retryTick: number): string {
  if (retryTick === 0) {
    return src;
  }

  try {
    const url = new URL(src);
    url.searchParams.set(IMAGE_RETRY_QUERY_PARAM, String(retryTick));
    return url.toString();
  } catch {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}${IMAGE_RETRY_QUERY_PARAM}=${retryTick}`;
  }
}

function ImageProcessingRetryState() {
  return (
    <div
      className="tw-flex tw-h-full tw-min-h-40 tw-w-full tw-items-center tw-justify-center tw-px-4 tw-py-8"
      aria-live="polite"
    >
      <span className="tw-text-sm tw-text-iron-400">
        {t(DEFAULT_LOCALE, "drop.media.processing")}
      </span>
    </div>
  );
}

function ImageLoadErrorState({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="tw-flex tw-h-full tw-min-h-40 tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-8">
      <span className="tw-text-sm tw-text-iron-400">
        {t(DEFAULT_LOCALE, "drop.media.loadFailed")}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="tw-rounded-md tw-bg-iron-700 tw-px-3 tw-py-1 tw-text-xs tw-text-white hover:tw-bg-iron-600"
      >
        {t(DEFAULT_LOCALE, "drop.media.retry")}
      </button>
    </div>
  );
}

function NaturalHeightImage({
  imgRef,
  primarySrc,
  fallbackSrc,
  retryTick,
  onLoad,
  onFinalError,
  imageObjectPosition,
}: {
  readonly imgRef: React.RefObject<HTMLImageElement | null>;
  readonly primarySrc: string;
  readonly fallbackSrc: string;
  readonly retryTick: number;
  readonly onLoad: () => void;
  readonly onFinalError: () => void;
  readonly imageObjectPosition: string;
}) {
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const { naturalHeight, naturalWidth } = event.currentTarget;

      if (naturalHeight > 0 && naturalWidth > 0) {
        setAspectRatio(`${naturalWidth} / ${naturalHeight}`);
      }

      onLoad();
    },
    [onLoad]
  );

  return (
    <span
      className="tw-relative tw-block tw-min-h-px tw-w-full tw-max-w-full tw-overflow-hidden"
      style={{ aspectRatio, maxHeight: "16rem" }}
    >
      {/* Drop media can come from hosts outside next.config.ts image remotePatterns. */}
      <FallbackImage
        key={retryTick}
        ref={imgRef}
        primarySrc={primarySrc}
        fallbackSrc={fallbackSrc}
        alt="Drop media"
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        optimize={false}
        className="tw-object-contain"
        style={{ objectPosition: imageObjectPosition }}
        onLoad={handleLoad}
        onError={onFinalError}
      />
    </span>
  );
}

function FillContainerImage({
  imgRef,
  primarySrc,
  fallbackSrc,
  retryTick,
  onLoad,
  onFinalError,
  imageObjectPosition,
}: {
  readonly imgRef: React.RefObject<HTMLImageElement | null>;
  readonly primarySrc: string;
  readonly fallbackSrc: string;
  readonly retryTick: number;
  readonly onLoad: () => void;
  readonly onFinalError: () => void;
  readonly imageObjectPosition: string;
}) {
  return (
    <span className="tw-relative tw-block tw-h-full tw-w-full tw-overflow-hidden">
      {/* Drop media can come from hosts outside next.config.ts image remotePatterns. */}
      <FallbackImage
        key={retryTick}
        ref={imgRef}
        primarySrc={primarySrc}
        fallbackSrc={fallbackSrc}
        alt="Drop media"
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        optimize={false}
        className="tw-object-contain"
        style={{ objectPosition: imageObjectPosition }}
        onLoad={onLoad}
        onError={onFinalError}
      />
    </span>
  );
}

type WaveDropPartContentMediaImageProps = {
  readonly src: string;
  readonly imageScale?: ImageScale | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly galleryItemId?: string | undefined;
  readonly fillContainer?: boolean | undefined;
};

export default function WaveDropPartContentMediaImage({
  src,
  imageScale = ImageScale.AUTOx450,
  ...props
}: WaveDropPartContentMediaImageProps) {
  return (
    <WaveDropPartContentMediaImageContent
      key={`${src}:${imageScale}`}
      src={src}
      imageScale={imageScale}
      {...props}
    />
  );
}

function WaveDropPartContentMediaImageContent({
  src,
  imageScale,
  imageObjectPosition = "center",
  galleryItemId,
  fillContainer = false,
}: WaveDropPartContentMediaImageProps & { readonly imageScale: ImageScale }) {
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [retryPending, setRetryPending] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const { isCapacitor } = useCapacitor();
  const imageGallery = useDropImageGallery();
  const imgRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "image",
      dialogTitle: "Save image",
      mimeType: "image",
    });

  const handleImageLoad = useCallback(() => {
    setLoaded(true);
    setFailedAttempts(0);
    setRetryPending(false);
  }, []);

  const handleError = useCallback(() => {
    setLoaded(false);
    setFailedAttempts((currentAttempts) => {
      const nextAttempts = currentAttempts + 1;
      if (nextAttempts <= MAX_AUTO_RETRY_ATTEMPTS) {
        setRetryPending(true);
      }
      return nextAttempts;
    });
  }, []);

  const manualRetry = useCallback(() => {
    setLoaded(false);
    setFailedAttempts(0);
    setRetryPending(false);
    setRetryTick((currentTick) => currentTick + 1);
  }, []);

  useEffect(() => {
    if (!retryPending) {
      return;
    }

    const retryTimeout = window.setTimeout(() => {
      setRetryPending(false);
      setRetryTick((currentTick) => currentTick + 1);
    }, AUTO_RETRY_DELAY_MS);

    return () => window.clearTimeout(retryTimeout);
  }, [retryPending]);

  const handleOpenModal = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (galleryItemId && imageGallery?.openImage(galleryItemId)) {
        return;
      }

      setIsModalOpen(true);
    },
    [galleryItemId, imageGallery]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleFullScreen = useCallback(() => {
    const fullscreenTarget = modalImageRef.current ?? imgRef.current;
    if (fullscreenTarget) {
      requestCenteredImageFullscreen(fullscreenTarget);
    }
  }, []);

  if (failedAttempts > MAX_AUTO_RETRY_ATTEMPTS) {
    return <ImageLoadErrorState onRetry={manualRetry} />;
  }

  if (retryPending) {
    return <ImageProcessingRetryState />;
  }

  const primarySrc = withRetryCacheBust(
    getScaledImageUri(src, imageScale),
    retryTick
  );
  const fallbackSrc = withRetryCacheBust(src, retryTick);
  const image = fillContainer ? (
    <FillContainerImage
      key={retryTick}
      imgRef={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={fallbackSrc}
      retryTick={retryTick}
      onLoad={handleImageLoad}
      onFinalError={handleError}
      imageObjectPosition={imageObjectPosition}
    />
  ) : (
    <NaturalHeightImage
      key={retryTick}
      imgRef={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={fallbackSrc}
      retryTick={retryTick}
      onLoad={handleImageLoad}
      onFinalError={handleError}
      imageObjectPosition={imageObjectPosition}
    />
  );

  return (
    <>
      <div
        className={`tw-relative tw-w-full tw-min-w-0 ${
          fillContainer ? "tw-h-full" : ""
        }`}
      >
        <InlineMediaActions
          variant="image"
          onOpen={openMedia}
          openLabel={openLabel}
          onDownload={downloadMedia}
          isDownloading={isDownloading}
          onFullscreen={handleFullScreen}
          fullscreenTargetAvailable={!isCapacitor}
        />
        <button
          type="button"
          onClick={handleOpenModal}
          aria-label="Open drop media"
          className={`tw-block tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 ${
            fillContainer ? "tw-h-full" : ""
          }`}
        >
          {image}
        </button>
      </div>

      {!loaded && (
        <div className="tw-sr-only" aria-live="polite">
          Loading image
        </div>
      )}

      {isModalOpen && (
        <ImageMediaModal
          src={src}
          imageRef={modalImageRef}
          onClose={handleCloseModal}
          onOpen={openMedia}
          openLabel={openLabel}
          onDownload={downloadMedia}
          isDownloading={isDownloading}
          onFullscreen={handleFullScreen}
          fullscreenTargetAvailable={!isCapacitor}
        />
      )}
    </>
  );
}
