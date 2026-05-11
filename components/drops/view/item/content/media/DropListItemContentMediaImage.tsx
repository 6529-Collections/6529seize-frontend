"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useInView } from "@/hooks/useInView";
import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { ExpandedMediaToolbar, InlineMediaActions } from "./MediaActionToolbar";
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
  readonly onContainerClick?: (() => void) | undefined;
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
  const { hasTouchScreen } = useDeviceInfo();

  const imgRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
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

  const handleImageClick = useCallback(
    (event: React.MouseEvent<HTMLImageElement>) => {
      if (disableModal) {
        return;
      }
      event.stopPropagation();
      setIsModalOpen(true);
    },
    [disableModal]
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
      fullscreenTarget.requestFullscreen().catch(() => undefined);
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

  useKeyPressEvent("Escape", () => {
    if (!disableModal) {
      handleCloseModal();
    }
  });

  const modalContent = (
    <div
      className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={handleCloseModal}
        className="tw-fixed tw-inset-0 tw-border-0 tw-bg-black tw-bg-opacity-80 tw-p-0"
      />
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(e) => setIsZoomed(e.state.scale > 1)}
      >
        {() => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
            <div className="tw-relative tw-flex tw-max-h-[90vh] tw-max-w-[95vw] tw-flex-col">
              <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center">
                <TransformComponent
                  wrapperClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  contentClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                >
                  <img
                    ref={modalImageRef}
                    src={src}
                    alt="Full size drop media"
                    style={{ pointerEvents: "auto" }}
                    className="tw-max-h-[75vh] tw-max-w-full tw-object-contain lg:tw-max-h-[90vh]"
                  />
                </TransformComponent>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
      <ExpandedMediaToolbar
        onOpen={openMedia}
        openLabel={openLabel}
        onDownload={() => void downloadMedia()}
        isDownloading={isDownloading}
        onFullscreen={handleFullScreen}
        fullscreenTargetAvailable
        onClose={handleCloseModal}
      />
    </div>
  );

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
            onDownload={() => void downloadMedia()}
            isDownloading={isDownloading}
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
      {!disableModal &&
        isModalOpen &&
        createPortal(modalContent, document.body)}
    </>
  );
}

export default React.memo(DropListItemContentMediaImage);
