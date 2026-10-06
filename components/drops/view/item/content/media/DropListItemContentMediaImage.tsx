"use client";

import {
  DropImagePreview,
  getDropImagePreviewSources,
} from "./DropImagePreview";
import { GifPreviewLoadingIndicator } from "./GifPreviewLoadingIndicator";
import { isGifImageUrl } from "@/helpers/gif-preview.helpers";
import Button from "@/components/utils/button/Button";
import { useDropImageGallery } from "@/components/drops/view/part/DropImageGalleryProvider";
import { ImageScale } from "@/helpers/image.helpers";
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
import Image from "next/image";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { ImageQualityToggle } from "./ImageQualityToggle";
import { useOriginalImage } from "./useOriginalImage";

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

function OriginalImageLoadingIndicator({ isGif }: { readonly isGif: boolean }) {
  const label = t(
    DEFAULT_LOCALE,
    isGif ? "drop.media.loadingOriginalGif" : "drop.media.loadingOriginalImage"
  );
  return (
    <output
      aria-label={label}
      className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-z-30 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-lg tw-bg-iron-950/90 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100"
    >
      {label}
    </output>
  );
}

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

function DropImageContent({
  src,
  alt,
  imageScale,
  retryTick,
  imgRef,
  loaded,
  intrinsicHeight,
  loadStrategy,
  resolvedObjectPosition,
  handleImageLoad,
  handleIntrinsicImageError,
  handleError,
  preferHighQualityImage,
}: {
  readonly src: string;
  readonly alt: string;
  readonly imageScale: ImageScale;
  readonly retryTick: number;
  readonly imgRef: React.RefObject<HTMLImageElement | null>;
  readonly loaded: boolean;
  readonly intrinsicHeight: boolean;
  readonly loadStrategy: MediaLoadStrategy;
  readonly resolvedObjectPosition: string;
  readonly handleImageLoad: () => void;
  readonly handleIntrinsicImageError: () => void;
  readonly handleError: () => void;
  readonly preferHighQualityImage: boolean;
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
      className={`tw-relative tw-block tw-min-h-40 tw-w-full tw-max-w-full tw-overflow-hidden ${isGifImageUrl(src) ? "" : "tw-bg-iron-900/40"}`}
      style={{
        aspectRatio: aspectRatio ?? INTRINSIC_IMAGE_RESERVED_ASPECT_RATIO,
        maxHeight: INTRINSIC_IMAGE_MAX_HEIGHT,
      }}
    >
      {/* Drop media can come from hosts outside next.config.ts image remotePatterns. */}
      <DropImagePreview
        key={retryTick}
        ref={imgRef}
        originalSrc={src}
        imageScale={imageScale}
        preferHighQuality={preferHighQualityImage}
        alt={alt}
        fill
        loading={loadStrategy === "eager" ? "eager" : undefined}
        sizes="(max-width: 768px) 100vw, 768px"
        className={`tw-object-contain ${imageClassName}`}
        style={{ objectPosition: resolvedObjectPosition }}
        onLoad={handleIntrinsicImageLoad}
        onError={handleIntrinsicImageError}
      />
    </span>
  ) : (
    <DropImagePreview
      key={retryTick}
      ref={imgRef}
      originalSrc={src}
      imageScale={imageScale}
      preferHighQuality={preferHighQualityImage}
      alt={alt}
      fill
      loading={loadStrategy === "eager" ? "eager" : undefined}
      sizes={
        preferHighQualityImage
          ? "(max-width: 1024px) 100vw, 896px"
          : "(max-width: 768px) 100vw, 768px"
      }
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
  readonly alt?: string | undefined;
  readonly openPreviewLabel?: string | undefined;
  readonly maxRetries?: number | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
  readonly intrinsicHeight?: boolean | undefined;
  readonly galleryItemId?: string | undefined;
  readonly showOriginalQualityToggle?: boolean | undefined;
  readonly preferHighQualityImage?: boolean | undefined;
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
  alt = t(DEFAULT_LOCALE, "drop.media.alt"),
  openPreviewLabel = t(DEFAULT_LOCALE, "drop.media.openPreview"),
  maxRetries = 0,
  isCompetitionDrop = false,
  disableModal = false,
  imageObjectPosition,
  imageScale,
  loadStrategy = "in-view",
  intrinsicHeight = false,
  galleryItemId,
  showOriginalQualityToggle = false,
  preferHighQualityImage = false,
}: DropListItemContentMediaImageProps & { readonly imageScale: ImageScale }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const { isCapacitor } = useCapacitor();
  const { hasTouchScreen } = useDeviceInfo();
  const imageGallery = useDropImageGallery();
  const quality = useOriginalImage(src, showOriginalQualityToggle);
  const canToggleOriginal =
    showOriginalQualityToggle && quality.canViewOriginal;
  const isGif = isGifImageUrl(src);

  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "image",
      dialogTitle: t(DEFAULT_LOCALE, "drop.media.saveDialogTitle"),
      mimeType: "image",
    });

  const handleImageLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (errorCount >= maxRetries) {
      setErrorCount(maxRetries + 1);
      return;
    }
    const delay = 500 * 2 ** errorCount; // 0.5s, 1s, 2s …
    setTimeout(() => {
      setErrorCount((count) => count + 1);
      setRetryTick((tick) => tick + 1); // changes key -> reload
    }, delay);
  }, [errorCount, maxRetries]);

  const manualRetry = () => {
    setErrorCount(0);
    setLoaded(false);
    setRetryTick((tick) => tick + 1);
  };

  const openModal = useCallback(() => {
    if (disableModal) {
      return;
    }

    if (
      !showOriginalQualityToggle &&
      galleryItemId &&
      imageGallery?.openImage(galleryItemId)
    ) {
      return;
    }

    setIsModalOpen(true);
  }, [disableModal, galleryItemId, imageGallery, showOriginalQualityToggle]);

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
    const fullscreenTarget =
      modalImageRef.current ??
      (quality.showingOriginal ? originalImgRef.current : imgRef.current);
    if (fullscreenTarget) {
      requestCenteredImageFullscreen(fullscreenTarget);
    }
  }, [quality.showingOriginal]);

  const shouldLoadImage = loadStrategy === "eager" || inView;
  const unavailable =
    getDropImagePreviewSources(src, imageScale).length === 0 ||
    errorCount > maxRetries;

  const resolvedObjectPosition =
    imageObjectPosition ?? (isCompetitionDrop ? "center" : "left top");
  const imageActionBoundsStyle = useContainedImageBoundsStyle({
    containerRef: imageFrameRef,
    imageRef: quality.showingOriginal ? originalImgRef : imgRef,
    loaded: quality.showingOriginal || loaded,
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
        {!loaded && !unavailable && !quality.showingOriginal && !isGif && (
          <LoadingPlaceholder hasTouchScreen={hasTouchScreen} />
        )}

        <div
          ref={imageFrameRef}
          className={`tw-relative ${
            intrinsicHeight ? "tw-w-full" : "tw-h-full tw-w-full"
          }`}
        >
          {shouldLoadImage && quality.requested && canToggleOriginal && (
            <Image
              ref={originalImgRef}
              src={resolveIpfsUrlSync(src)}
              alt={t(
                DEFAULT_LOCALE,
                isGif
                  ? "drop.media.originalGifAlt"
                  : "drop.media.originalImageAlt"
              )}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized
              loading="eager"
              hidden={!quality.showingOriginal}
              style={{
                objectFit: "contain",
                objectPosition: resolvedObjectPosition,
              }}
              onLoad={quality.onLoad}
              onError={quality.onError}
            />
          )}
          {shouldLoadImage && (
            <span
              data-drop-image-content
              className={
                intrinsicHeight ? "tw-block" : "tw-absolute tw-inset-0"
              }
              hidden={quality.showingOriginal && canToggleOriginal}
            >
              <DropImageContent
                src={src}
                alt={alt}
                imageScale={imageScale}
                retryTick={retryTick}
                imgRef={imgRef}
                loaded={loaded}
                intrinsicHeight={intrinsicHeight}
                loadStrategy={loadStrategy}
                resolvedObjectPosition={resolvedObjectPosition}
                handleImageLoad={handleImageLoad}
                handleIntrinsicImageError={handleIntrinsicImageError}
                handleError={handleError}
                preferHighQualityImage={preferHighQualityImage}
              />
            </span>
          )}
          {quality.loading && canToggleOriginal && !isModalOpen && (
            <OriginalImageLoadingIndicator isGif={isGif} />
          )}
          {shouldLoadImage &&
            !loaded &&
            !unavailable &&
            !quality.showingOriginal &&
            isGif && <GifPreviewLoadingIndicator />}
          {unavailable && !quality.showingOriginal && !disableModal && (
            <div className="tw-absolute tw-bottom-3 tw-left-1/2 tw-z-30 -tw-translate-x-1/2">
              <Button
                type="button"
                variant="tertiary"
                size="xs"
                onClick={manualRetry}
              >
                {t(DEFAULT_LOCALE, "drop.media.retry")}
              </Button>
            </div>
          )}
          {!disableModal && (
            <ImageInteractionLayer
              boundsStyle={imageActionBoundsStyle}
              label={openPreviewLabel}
              onClick={handleImageClick}
              actions={
                loaded || unavailable || canToggleOriginal ? (
                  <InlineMediaActions
                    variant="image"
                    onOpen={openMedia}
                    openLabel={openLabel}
                    onDownload={downloadMedia}
                    isDownloading={isDownloading}
                    onFullscreen={handleFullScreen}
                    fullscreenTargetAvailable={
                      !isCapacitor && (loaded || quality.showingOriginal)
                    }
                    visibility={
                      unavailable || canToggleOriginal
                        ? "always"
                        : "desktop-hover"
                    }
                    className={
                      canToggleOriginal ? "tw-pointer-events-auto" : undefined
                    }
                  >
                    {canToggleOriginal && (
                      <ImageQualityToggle
                        showingOriginal={quality.requested}
                        failed={quality.failed}
                        onToggle={quality.toggle}
                        isGif={isGif}
                      />
                    )}
                  </InlineMediaActions>
                ) : null
              }
            />
          )}
        </div>
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
          originalQuality={canToggleOriginal ? quality : undefined}
          preferHighQualityPreview={preferHighQualityImage}
        />
      )}
    </>
  );
}

export default React.memo(DropListItemContentMediaImage);
