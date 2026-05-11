"use client";

import {
  ImageMediaModal,
  requestCenteredImageFullscreen,
} from "@/components/drops/view/item/content/media/ImageMediaModal";
import { InlineMediaActions } from "@/components/drops/view/item/content/media/MediaActionToolbar";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
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
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [usedFallback, setUsedFallback] = useState(false);

  const handleError = useCallback(() => {
    if (!usedFallback) {
      setCurrentSrc(fallbackSrc);
      setUsedFallback(true);
      return;
    }

    onFinalError();
  }, [fallbackSrc, onFinalError, usedFallback]);

  return (
    <img
      key={retryTick}
      ref={imgRef}
      src={currentSrc}
      alt="Drop media"
      loading="lazy"
      className="tw-block tw-h-auto tw-max-h-64 tw-w-full tw-max-w-full tw-object-contain"
      style={{ objectPosition: imageObjectPosition }}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}

export default function WaveDropPartContentFullWidthImage({
  src,
  imageScale = ImageScale.AUTOx450,
  imageObjectPosition = "center",
}: {
  readonly src: string;
  readonly imageScale?: ImageScale | undefined;
  readonly imageObjectPosition?: string | undefined;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "image",
      dialogTitle: "Save image",
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
      setIsModalOpen(true);
    },
    []
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

  return (
    <>
      <div className="tw-relative tw-w-full">
        <InlineMediaActions
          variant="image"
          onOpen={openMedia}
          openLabel={openLabel}
          onDownload={downloadMedia}
          isDownloading={isDownloading}
          onFullscreen={handleFullScreen}
          fullscreenTargetAvailable
        />
        <button
          type="button"
          onClick={handleOpenModal}
          aria-label="Open drop media"
          className="tw-block tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0"
        >
          <NaturalHeightImage
            key={retryTick}
            imgRef={imgRef}
            primarySrc={getScaledImageUri(src, imageScale)}
            fallbackSrc={src}
            retryTick={retryTick}
            onLoad={handleImageLoad}
            onFinalError={handleError}
            imageObjectPosition={imageObjectPosition}
          />
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
        />
      )}
    </>
  );
}
