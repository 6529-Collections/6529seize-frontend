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
import React, { useCallback, useRef, useState } from "react";

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

export default function WaveDropPartContentMediaImage({
  src,
  imageScale = ImageScale.AUTOx450,
  imageObjectPosition = "center",
  galleryItemId,
  fillContainer = false,
}: {
  readonly src: string;
  readonly imageScale?: ImageScale | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly galleryItemId?: string | undefined;
  readonly fillContainer?: boolean | undefined;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
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
  }, []);

  const handleError = useCallback(() => {
    setErrorCount(1);
  }, []);

  const manualRetry = useCallback(() => {
    setLoaded(false);
    setErrorCount(0);
    setRetryTick((currentTick) => currentTick + 1);
  }, []);

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

  if (errorCount > 0) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-8">
        <span className="tw-text-sm tw-text-iron-400">
          Couldn’t load image.
        </span>
        <button
          type="button"
          onClick={manualRetry}
          className="tw-rounded-md tw-bg-iron-700 tw-px-3 tw-py-1 tw-text-xs tw-text-white hover:tw-bg-iron-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const primarySrc = getScaledImageUri(src, imageScale);
  const image = fillContainer ? (
    <FillContainerImage
      key={retryTick}
      imgRef={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={src}
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
      fallbackSrc={src}
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
