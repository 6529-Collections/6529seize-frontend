"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import { useDropImageGallery } from "@/components/drops/view/part/DropImageGalleryProvider";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useInView } from "@/hooks/useInView";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React, { useCallback, useRef, useState } from "react";
import { useContainedImageBoundsStyle } from "./containedImageBounds";
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
const INTRINSIC_IMAGE_RESERVED_ASPECT_RATIO = "16 / 9";
const INTRINSIC_IMAGE_MAX_HEIGHT = "16rem";

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

function RetryImageMessage({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2">
      <span className="tw-text-sm tw-text-iron-400">
        {t(DEFAULT_LOCALE, "drop.media.loadFailed")}
      </span>
      <button
        onClick={onRetry}
        className="tw-rounded-md tw-bg-iron-700 tw-px-3 tw-py-1 tw-text-xs tw-text-white hover:tw-bg-iron-600"
      >
        {t(DEFAULT_LOCALE, "drop.media.retry")}
      </button>
    </div>
  );
}

function DropImageContent({
  src,
  primarySrc,
  retryTick,
  imgRef,
  loaded,
  intrinsicHeight,
  loadStrategy,
  resolvedObjectPosition,
  handleImageLoad,
  handleIntrinsicImageError,
  handleError,
}: {
  readonly src: string;
  readonly primarySrc: string;
  readonly retryTick: number;
  readonly imgRef: React.RefObject<HTMLImageElement | null>;
  readonly loaded: boolean;
  readonly intrinsicHeight: boolean;
  readonly loadStrategy: MediaLoadStrategy;
  readonly resolvedObjectPosition: string;
  readonly handleImageLoad: () => void;
  readonly handleIntrinsicImageError: () => void;
  readonly handleError: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();
  const imageClassName = `${
    intrinsicHeight
      ? "tw-max-h-64 tw-max-w-full"
      : "tw-max-h-full tw-max-w-full"
  } ${loaded ? "tw-opacity-100" : "tw-opacity-0"}`;

  const handleIntrinsicImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const { naturalHeight, naturalWidth } = event.currentTarget;

      if (naturalHeight > 0 && naturalWidth > 0) {
        setAspectRatio(`${naturalWidth} / ${naturalHeight}`);
      }

      handleImageLoad();
    },
    [handleImageLoad]
  );

  return intrinsicHeight ? (
    <span
      className="tw-relative tw-block tw-min-h-40 tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-900/40"
      style={{
        aspectRatio: aspectRatio ?? INTRINSIC_IMAGE_RESERVED_ASPECT_RATIO,
        maxHeight: INTRINSIC_IMAGE_MAX_HEIGHT,
      }}
    >
      {/* Drop media can come from hosts outside next.config.ts image remotePatterns. */}
      <FallbackImage
        key={retryTick}
        ref={imgRef}
        primarySrc={primarySrc}
        fallbackSrc={src}
        alt={t(DEFAULT_LOCALE, "drop.media.alt")}
        fill
        optimize={false}
        loading={loadStrategy === "eager" ? "eager" : undefined}
        sizes="(max-width: 768px) 100vw, 768px"
        className={`tw-object-contain ${imageClassName}`}
        style={{ objectPosition: resolvedObjectPosition }}
        onLoad={handleIntrinsicImageLoad}
        onError={handleIntrinsicImageError}
      />
    </span>
  ) : (
    <FallbackImage
      key={retryTick}
      ref={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={src}
      alt={t(DEFAULT_LOCALE, "drop.media.alt")}
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
}

function ImageInteractionLayer({
  actions,
  boundsStyle,
  label,
  onClick,
}: {
  readonly actions: React.ReactNode;
  readonly boundsStyle: React.CSSProperties | null;
  readonly label: string;
  readonly onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div
      className="tw-group/media tw-pointer-events-none tw-absolute tw-z-20"
      style={boundsStyle ?? { inset: 0 }}
    >
      <button
        type="button"
        className="tw-pointer-events-auto tw-absolute tw-inset-0 tw-z-10 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-shadow-[0_0_0_4px_rgba(0,0,0,0.72)] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        onClick={onClick}
        aria-label={label}
      />
      {actions}
    </div>
  );
}

type DropListItemContentMediaImageProps = {
  readonly src: string;
  readonly maxRetries?: number | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
  readonly intrinsicHeight?: boolean | undefined;
  readonly galleryItemId?: string | undefined;
};

function DropListItemContentMediaImage({
  src,
  imageScale = ImageScale.AUTOx450,
  ...props
}: DropListItemContentMediaImageProps) {
  return (
    <DropListItemContentMediaImageContent
      key={`${src}:${imageScale}`}
      src={src}
      imageScale={imageScale}
      {...props}
    />
  );
}

function DropListItemContentMediaImageContent({
  src,
  maxRetries = 0,
  isCompetitionDrop = false,
  disableModal = false,
  imageObjectPosition,
  imageScale,
  loadStrategy = "in-view",
  intrinsicHeight = false,
  galleryItemId,
}: DropListItemContentMediaImageProps & { readonly imageScale: ImageScale }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const { isCapacitor } = useCapacitor();
  const { hasTouchScreen } = useDeviceInfo();
  const imageGallery = useDropImageGallery();

  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "image",
      dialogTitle: t(DEFAULT_LOCALE, "drop.media.saveDialogTitle"),
      mimeType: "image",
    });
  const primarySrc = getScaledImageUri(src, imageScale);

  const handleImageLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (errorCount >= maxRetries) return;
    const delay = 500 * 2 ** errorCount; // 0.5s, 1s, 2s …
    setTimeout(() => {
      setErrorCount((count) => count + 1);
      setRetryTick((tick) => tick + 1); // changes key -> reload
    }, delay);
  }, [errorCount, maxRetries]);

  const manualRetry = useCallback(() => {
    setErrorCount(0);
    setLoaded(false);
    setRetryTick((tick) => tick + 1);
  }, []);

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
  const imageActionBoundsStyle = useContainedImageBoundsStyle({
    containerRef: imageFrameRef,
    imageRef: imgRef,
    loaded,
    objectPosition: resolvedObjectPosition,
  });
  const handleIntrinsicImageError = useCallback(() => {
    handleError();
  }, [handleError]);

  return (
    <>
      <div
        ref={ref}
        className={`tw-relative tw-flex tw-w-full tw-items-center ${
          intrinsicHeight ? "tw-min-h-40" : "tw-h-full"
        } ${isCompetitionDrop ? "tw-justify-center" : ""}`}
      >
        {!loaded && errorCount <= maxRetries && (
          <LoadingPlaceholder hasTouchScreen={hasTouchScreen} />
        )}

        <div
          ref={imageFrameRef}
          className={`tw-relative ${
            intrinsicHeight ? "tw-w-full" : "tw-h-full tw-w-full"
          }`}
        >
          {shouldLoadImage && errorCount <= maxRetries && (
            <DropImageContent
              src={src}
              primarySrc={primarySrc}
              retryTick={retryTick}
              imgRef={imgRef}
              loaded={loaded}
              intrinsicHeight={intrinsicHeight}
              loadStrategy={loadStrategy}
              resolvedObjectPosition={resolvedObjectPosition}
              handleImageLoad={handleImageLoad}
              handleIntrinsicImageError={handleIntrinsicImageError}
              handleError={handleError}
            />
          )}
          {!disableModal && (
            <ImageInteractionLayer
              boundsStyle={imageActionBoundsStyle}
              label={t(DEFAULT_LOCALE, "drop.media.openPreview")}
              onClick={handleImageClick}
              actions={
                loaded ? (
                  <InlineMediaActions
                    variant="image"
                    onOpen={openMedia}
                    openLabel={openLabel}
                    onDownload={downloadMedia}
                    isDownloading={isDownloading}
                    onFullscreen={handleFullScreen}
                    fullscreenTargetAvailable={!isCapacitor}
                    visibility="desktop-hover"
                  />
                ) : null
              }
            />
          )}
        </div>
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
