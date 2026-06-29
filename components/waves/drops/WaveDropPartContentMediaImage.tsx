"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import {
  ImageMediaModal,
  requestCenteredImageFullscreen,
} from "@/components/drops/view/item/content/media/ImageMediaModal";
import { InlineMediaActions } from "@/components/drops/view/item/content/media/MediaActionToolbar";
import { useContainedImageBoundsStyle } from "@/components/drops/view/item/content/media/containedImageBounds";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import { useDropImageGallery } from "@/components/drops/view/part/DropImageGalleryProvider";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

const AUTO_RETRY_DELAY_MS = 1500;
const MAX_AUTO_RETRY_ATTEMPTS = 40;
const MAX_FAILED_LOAD_ATTEMPTS = MAX_AUTO_RETRY_ATTEMPTS + 1;
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

type ImageViewState = {
  readonly loaded: boolean;
  readonly isModalOpen: boolean;
  readonly failedAttempts: number;
  readonly retryPending: boolean;
  readonly retryTick: number;
};

type ImageViewAction =
  | { readonly type: "image-loaded" }
  | { readonly type: "image-error" }
  | { readonly type: "manual-retry" }
  | { readonly type: "auto-retry" }
  | { readonly type: "open-modal" }
  | { readonly type: "close-modal" };

const initialImageViewState: ImageViewState = {
  loaded: false,
  isModalOpen: false,
  failedAttempts: 0,
  retryPending: false,
  retryTick: 0,
};

function imageViewReducer(
  state: ImageViewState,
  action: ImageViewAction
): ImageViewState {
  switch (action.type) {
    case "image-loaded":
      return {
        ...state,
        loaded: true,
        failedAttempts: 0,
        retryPending: false,
      };
    case "image-error": {
      const failedAttempts = state.failedAttempts + 1;
      return {
        ...state,
        loaded: false,
        failedAttempts,
        retryPending: failedAttempts <= MAX_AUTO_RETRY_ATTEMPTS,
      };
    }
    case "manual-retry":
      return {
        ...state,
        loaded: false,
        failedAttempts: 0,
        retryPending: false,
        retryTick: state.retryTick + 1,
      };
    case "auto-retry":
      return {
        ...state,
        retryPending: false,
        retryTick: state.retryTick + 1,
      };
    case "open-modal":
      return { ...state, isModalOpen: true };
    case "close-modal":
      return { ...state, isModalOpen: false };
  }
}

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
  const [imageViewState, dispatchImageView] = useReducer(
    imageViewReducer,
    initialImageViewState
  );
  const { isCapacitor } = useCapacitor();
  const imageGallery = useDropImageGallery();
  const imageFrameRef = useRef<HTMLDivElement>(null);
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
    dispatchImageView({ type: "image-loaded" });
  }, []);

  const handleError = useCallback(() => {
    dispatchImageView({ type: "image-error" });
  }, []);

  const manualRetry = useCallback(() => {
    dispatchImageView({ type: "manual-retry" });
  }, []);

  useEffect(() => {
    if (!imageViewState.retryPending) {
      return;
    }

    const retryTimeout = window.setTimeout(() => {
      dispatchImageView({ type: "auto-retry" });
    }, AUTO_RETRY_DELAY_MS);

    return () => window.clearTimeout(retryTimeout);
  }, [imageViewState.retryPending]);

  const handleOpenModal = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (galleryItemId && imageGallery?.openImage(galleryItemId)) {
        return;
      }

      dispatchImageView({ type: "open-modal" });
    },
    [galleryItemId, imageGallery]
  );

  const handleCloseModal = useCallback(() => {
    dispatchImageView({ type: "close-modal" });
  }, []);

  const handleFullScreen = useCallback(() => {
    const fullscreenTarget = modalImageRef.current ?? imgRef.current;
    if (fullscreenTarget) {
      requestCenteredImageFullscreen(fullscreenTarget);
    }
  }, []);
  const imageActionBoundsStyle = useContainedImageBoundsStyle({
    containerRef: imageFrameRef,
    imageRef: imgRef,
    loaded: imageViewState.loaded,
    objectPosition: imageObjectPosition,
  });

  if (imageViewState.failedAttempts >= MAX_FAILED_LOAD_ATTEMPTS) {
    return <ImageLoadErrorState onRetry={manualRetry} />;
  }

  if (imageViewState.retryPending) {
    return <ImageProcessingRetryState />;
  }

  const primarySrc = withRetryCacheBust(
    getScaledImageUri(src, imageScale),
    imageViewState.retryTick
  );
  const fallbackSrc = withRetryCacheBust(src, imageViewState.retryTick);
  const image = fillContainer ? (
    <FillContainerImage
      key={imageViewState.retryTick}
      imgRef={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={fallbackSrc}
      retryTick={imageViewState.retryTick}
      onLoad={handleImageLoad}
      onFinalError={handleError}
      imageObjectPosition={imageObjectPosition}
    />
  ) : (
    <NaturalHeightImage
      key={imageViewState.retryTick}
      imgRef={imgRef}
      primarySrc={primarySrc}
      fallbackSrc={fallbackSrc}
      retryTick={imageViewState.retryTick}
      onLoad={handleImageLoad}
      onFinalError={handleError}
      imageObjectPosition={imageObjectPosition}
    />
  );

  return (
    <>
      <div
        ref={imageFrameRef}
        className={`tw-relative tw-w-full tw-min-w-0 ${
          fillContainer ? "tw-h-full" : ""
        }`}
      >
        {image}
        <div
          className="tw-group/media tw-pointer-events-none tw-absolute tw-z-20"
          style={imageActionBoundsStyle ?? { inset: 0 }}
        >
          <button
            type="button"
            onClick={handleOpenModal}
            aria-label="Open drop media"
            className="tw-pointer-events-auto tw-absolute tw-inset-0 tw-z-10 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          />
          {imageActionBoundsStyle ? (
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
          ) : null}
        </div>
      </div>

      {!imageViewState.loaded && (
        <div className="tw-sr-only" aria-live="polite">
          Loading image
        </div>
      )}

      {imageViewState.isModalOpen && (
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
