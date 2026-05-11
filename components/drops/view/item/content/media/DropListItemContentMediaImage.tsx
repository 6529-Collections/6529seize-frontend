"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
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

function DropListItemContentMediaImage({
  src,
  maxRetries = 0,
  isCompetitionDrop = false,
  disableModal = false,
  imageObjectPosition,
  imageScale = ImageScale.AUTOx450,
  loadStrategy = "in-view",
}: {
  readonly src: string;
  readonly maxRetries?: number | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const { isCapacitor } = useCapacitor();
  const { hasTouchScreen } = useDeviceInfo();

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

    setIsModalOpen(true);
  }, [disableModal]);

  const handleImageClick = useCallback(
    (event: React.MouseEvent<HTMLImageElement>) => {
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
  const shouldLoadImage = loadStrategy === "eager" || inView;

  const resolvedObjectPosition =
    imageObjectPosition ?? (isCompetitionDrop ? "center" : "left top");

  return (
    <>
      <div
        ref={ref}
        className={`tw-relative tw-flex tw-h-full tw-w-full tw-items-center ${
          isCompetitionDrop ? "tw-justify-center" : ""
        }`}
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
          <div
            className={`tw-rounded-xl tw-bg-iron-800 ${
              hasTouchScreen ? "" : "tw-animate-pulse"
            }`}
            style={loadingPlaceholderStyle}
          />
        )}

        {shouldLoadImage && errorCount <= maxRetries && (
          <FallbackImage
            key={retryTick}
            ref={imgRef}
            primarySrc={getScaledImageUri(src, imageScale)}
            fallbackSrc={src}
            alt="Drop media"
            optimize={false}
            fill
            loading={loadStrategy === "eager" ? "eager" : undefined}
            sizes="(max-width: 768px) 100vw, 768px"
            className={`tw-max-h-full tw-max-w-full ${
              !loaded ? "tw-opacity-0" : "tw-opacity-100"
            } ${disableModal ? "" : "tw-cursor-pointer"}`}
            style={{
              objectFit: "contain",
              objectPosition: resolvedObjectPosition,
            }}
            onLoad={handleImageLoad}
            onClick={handleImageClick}
            onError={handleError}
          />
        )}
        {errorCount > maxRetries && (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2">
            <span className="tw-text-sm tw-text-iron-400">
              Couldn’t load image.
            </span>
            <button
              onClick={manualRetry}
              className="tw-rounded-md tw-bg-iron-700 tw-px-3 tw-py-1 tw-text-xs tw-text-white hover:tw-bg-iron-600"
            >
              Retry
            </button>
          </div>
        )}
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
