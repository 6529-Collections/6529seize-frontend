"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import { useDropImageGallery } from "@/components/drops/view/part/DropImageGalleryProvider";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useInView } from "@/hooks/useInView";
import React, { useCallback, useRef, useState } from "react";
import { InlineMediaActions } from "./MediaActionToolbar";
import {
  ImageMediaModal,
  requestCenteredImageFullscreen,
} from "./ImageMediaModal";
import type { MediaLoadStrategy } from "./mediaLoadStrategy";
import { useMediaActions } from "./useMediaActions";

const loadingPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  maxWidth: "100%",
  maxHeight: "100%",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

function LoadingPlaceholder({
  hasTouchScreen,
}: {
  readonly hasTouchScreen: boolean;
}) {
  return (
    <div
      className={`tw-rounded-xl tw-bg-iron-800 ${
        hasTouchScreen ? "" : "tw-animate-pulse"
      }`}
      style={loadingPlaceholderStyle}
    />
  );
}

function ImageButton({
  children,
  intrinsicHeight,
  onClick,
}: {
  readonly children: React.ReactNode;
  readonly intrinsicHeight: boolean;
  readonly onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      className={`tw-border-0 tw-bg-transparent tw-p-0 ${
        intrinsicHeight
          ? "tw-block tw-w-full"
          : "tw-absolute tw-inset-0 tw-h-full tw-w-full"
      }`}
      onClick={onClick}
      aria-label="Open image preview"
    >
      {children}
    </button>
  );
}

function RetryImageMessage({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2">
      <span className="tw-text-sm tw-text-iron-400">Couldn’t load image.</span>
      <button
        onClick={onRetry}
        className="tw-rounded-md tw-bg-iron-700 tw-px-3 tw-py-1 tw-text-xs tw-text-white hover:tw-bg-iron-600"
      >
        Retry
      </button>
    </div>
  );
}

function DropImageContent({
  src,
  primarySrc,
  currentSrc,
  retryTick,
  imgRef,
  loaded,
  disableModal,
  intrinsicHeight,
  loadStrategy,
  resolvedObjectPosition,
  handleImageLoad,
  handleImageClick,
  handleIntrinsicImageError,
  handleError,
}: {
  readonly src: string;
  readonly primarySrc: string;
  readonly currentSrc: string;
  readonly retryTick: number;
  readonly imgRef: React.RefObject<HTMLImageElement | null>;
  readonly loaded: boolean;
  readonly disableModal: boolean;
  readonly intrinsicHeight: boolean;
  readonly loadStrategy: MediaLoadStrategy;
  readonly resolvedObjectPosition: string;
  readonly handleImageLoad: () => void;
  readonly handleImageClick: React.MouseEventHandler<HTMLButtonElement>;
  readonly handleIntrinsicImageError: () => void;
  readonly handleError: () => void;
}) {
  const imageClassName = `${
    intrinsicHeight ? "tw-max-w-full" : "tw-max-h-full tw-max-w-full"
  } ${
    loaded ? "tw-opacity-100" : "tw-opacity-0"
  } ${disableModal ? "" : "tw-cursor-pointer"}`;

  const image = intrinsicHeight ? (
    <img
      key={retryTick}
      ref={imgRef}
      src={currentSrc}
      alt="Drop media"
      loading={loadStrategy === "eager" ? "eager" : "lazy"}
      className={`tw-block tw-h-auto tw-max-h-64 tw-w-full tw-object-contain ${imageClassName}`}
      style={{ objectPosition: resolvedObjectPosition }}
      onLoad={handleImageLoad}
      onError={handleIntrinsicImageError}
    />
  ) : (
    <FallbackImage
      key={retryTick}
      ref={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={src}
      alt="Drop media"
      optimize={false}
      fill
      loading={loadStrategy === "eager" ? "eager" : undefined}
      sizes="(max-width: 768px) 100vw, 768px"
      className={imageClassName}
      style={{
        objectFit: "contain",
        objectPosition: resolvedObjectPosition,
      }}
      onLoad={handleImageLoad}
      onError={handleError}
    />
  );

  if (disableModal) {
    return image;
  }

  return (
    <ImageButton intrinsicHeight={intrinsicHeight} onClick={handleImageClick}>
      {image}
    </ImageButton>
  );
}

function DropListItemContentMediaImage({
  src,
  maxRetries = 0,
  isCompetitionDrop = false,
  disableModal = false,
  imageObjectPosition,
  imageScale = ImageScale.AUTOx450,
  loadStrategy = "in-view",
  intrinsicHeight = false,
  galleryItemId,
}: {
  readonly src: string;
  readonly maxRetries?: number | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
  readonly intrinsicHeight?: boolean | undefined;
  readonly galleryItemId?: string | undefined;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const { isCapacitor } = useCapacitor();
  const { hasTouchScreen } = useDeviceInfo();
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
    if (errorCount >= maxRetries) return;
    const delay = 500 * 2 ** errorCount; // 0.5s, 1s, 2s …
    setTimeout(() => {
      setErrorCount((n) => n + 1);
      setRetryTick((t) => t + 1); // changes key -> reload
    }, delay);
  }, [errorCount, maxRetries]);

  const manualRetry = () => {
    setErrorCount(0);
    setLoaded(false);
    setRetryTick((t) => t + 1);
  };

  const openModal = useCallback(() => {
    if (disableModal) {
      return;
    }

    if (galleryItemId && imageGallery?.openImage(galleryItemId)) {
      return;
    }

    setIsModalOpen(true);
  }, [disableModal, galleryItemId, imageGallery]);

  const handleImageClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disableModal) {
        return;
      }
      event.stopPropagation();
      openModal();
    },
    [disableModal, openModal]
  );

  const handleCloseModal = useCallback(
    (
      event?:
        | React.MouseEvent<HTMLDivElement>
        | React.KeyboardEvent<HTMLDivElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      event?.stopPropagation();
      setIsModalOpen(false);
    },
    []
  );

  const handleFullScreen = useCallback(() => {
    const fullscreenTarget = modalImageRef.current ?? imgRef.current;
    if (fullscreenTarget) {
      requestCenteredImageFullscreen(fullscreenTarget);
    }
  }, []);

  const shouldLoadImage = loadStrategy === "eager" || inView;

  const resolvedObjectPosition =
    imageObjectPosition ?? (isCompetitionDrop ? "center" : "left top");
  const primarySrc = getScaledImageUri(src, imageScale);
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [usedFallback, setUsedFallback] = useState(false);

  React.useEffect(() => {
    setCurrentSrc(primarySrc);
    setUsedFallback(false);
  }, [primarySrc]);

  const handleIntrinsicImageError = useCallback(() => {
    if (!usedFallback) {
      if (currentSrc !== src) {
        setCurrentSrc(src);
        setUsedFallback(true);
        return;
      }
    }

    handleError();
  }, [currentSrc, handleError, src, usedFallback]);

  return (
    <>
      <div
        ref={ref}
        className={`tw-relative tw-flex tw-w-full tw-items-center ${
          intrinsicHeight ? "tw-min-h-40" : "tw-h-full"
        } ${isCompetitionDrop ? "tw-justify-center" : ""}`}
      >
        {!disableModal && (
          <InlineMediaActions
            variant="image"
            onOpen={openMedia}
            openLabel={openLabel}
            onDownload={downloadMedia}
            isDownloading={isDownloading}
            onFullscreen={handleFullScreen}
            fullscreenTargetAvailable={!isCapacitor}
          />
        )}
        {!loaded && errorCount <= maxRetries && (
          <LoadingPlaceholder hasTouchScreen={hasTouchScreen} />
        )}

        {shouldLoadImage && errorCount <= maxRetries && (
          <DropImageContent
            src={src}
            primarySrc={primarySrc}
            currentSrc={currentSrc}
            retryTick={retryTick}
            imgRef={imgRef}
            loaded={loaded}
            disableModal={disableModal}
            intrinsicHeight={intrinsicHeight}
            loadStrategy={loadStrategy}
            resolvedObjectPosition={resolvedObjectPosition}
            handleImageLoad={handleImageLoad}
            handleImageClick={handleImageClick}
            handleIntrinsicImageError={handleIntrinsicImageError}
            handleError={handleError}
          />
        )}
        {errorCount > maxRetries && <RetryImageMessage onRetry={manualRetry} />}
      </div>
      {!disableModal && isModalOpen && (
        <ImageMediaModal
          src={src}
          imageRef={modalImageRef}
          onClose={() => handleCloseModal()}
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

export default React.memo(DropListItemContentMediaImage);
