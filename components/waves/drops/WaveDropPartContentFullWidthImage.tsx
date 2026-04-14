"use client";

import { fullScreenSupported } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { faExpand, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

const tooltipProps = {
  delayShow: 250,
  place: "top" as const,
  style: { backgroundColor: "#37373E", color: "white", zIndex: 1002 },
};

const modalButtonClasses =
  "tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out";

function NaturalHeightImage({
  imgRef,
  primarySrc,
  fallbackSrc,
  retryTick,
  onLoad,
  onFinalError,
}: {
  readonly imgRef: React.RefObject<HTMLImageElement | null>;
  readonly primarySrc: string;
  readonly fallbackSrc: string;
  readonly retryTick: number;
  readonly onLoad: () => void;
  readonly onFinalError: () => void;
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={retryTick}
      ref={imgRef}
      src={currentSrc}
      alt="Drop media"
      loading="lazy"
      className="tw-block tw-h-auto tw-w-full tw-max-w-full tw-object-contain"
      style={{ objectPosition: "center" }}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}

export default function WaveDropPartContentFullWidthImage({
  src,
  imageScale = ImageScale.AUTOx450,
}: {
  readonly src: string;
  readonly imageScale?: ImageScale | undefined;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { isCapacitor } = useCapacitor();

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

  const handleFullScreen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const fullscreenTarget = modalImageRef.current ?? imgRef.current;
      if (fullscreenTarget) {
        fullscreenTarget.requestFullscreen().catch(() => undefined);
      }
    },
    []
  );

  useKeyPressEvent("Escape", () => {
    handleCloseModal();
  });

  const modalContent = (
    <div
      className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default"
      onClick={handleCloseModal}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div className="tw-pointer-events-none tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-80" />
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(event) => setIsZoomed(event.state.scale > 1)}
      >
        {({ resetTransform }) => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
            <div className="tw-relative tw-flex tw-max-h-[90vh] tw-max-w-[95vw] tw-flex-col lg:tw-flex-row">
              <div
                role="button"
                className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center"
                onClick={(event) => event.stopPropagation()}
                tabIndex={0}
                aria-label="Full size drop media"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                  }
                }}
              >
                <TransformComponent
                  wrapperClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  contentClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={modalImageRef}
                    src={src}
                    alt="Full size drop media"
                    style={{ pointerEvents: "auto" }}
                    className="tw-max-h-[75vh] tw-max-w-full tw-object-contain lg:tw-max-h-[90vh]"
                  />
                </TransformComponent>
              </div>

              <div className="tw-fixed tw-right-4 tw-top-2 tw-z-[1001] tw-flex tw-flex-row tw-gap-x-4 tw-pt-[env(safe-area-inset-top,0px)] lg:tw-relative lg:tw-right-auto lg:tw-top-0 lg:tw-ml-4 lg:tw-flex-col-reverse lg:tw-gap-x-0 lg:tw-gap-y-2 lg:tw-self-start lg:tw-pt-0">
                {isZoomed && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      resetTransform();
                      setIsZoomed(false);
                    }}
                    data-tooltip-id={`reset-zoom-${src}`}
                    className={modalButtonClasses}
                    aria-label="Reset"
                  >
                    <FontAwesomeIcon
                      icon={faRotateLeft}
                      className="tw-size-4"
                    />
                  </button>
                )}

                <Link href={src} target="_blank" rel="noopener noreferrer">
                  <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    data-tooltip-id={`open-browser-${src}`}
                    className={modalButtonClasses}
                    aria-label="Open image in new tab"
                  >
                    <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                </Link>

                {fullScreenSupported() && !isCapacitor && (
                  <button
                    type="button"
                    onClick={handleFullScreen}
                    data-tooltip-id={`full-screen-${src}`}
                    className={modalButtonClasses}
                    aria-label="Full screen"
                  >
                    <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseModal}
                  data-tooltip-id={`close-modal-${src}`}
                  className={modalButtonClasses}
                  aria-label="Close modal"
                >
                  <svg
                    className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>

      {!isCapacitor && (
        <>
          <Tooltip id={`open-browser-${src}`} {...tooltipProps}>
            <span className="tw-text-xs">Open in Browser</span>
          </Tooltip>

          <Tooltip id={`full-screen-${src}`} {...tooltipProps}>
            <span className="tw-text-xs">Full screen</span>
          </Tooltip>

          <Tooltip id={`reset-zoom-${src}`} {...tooltipProps}>
            <span className="tw-text-xs">Reset zoom</span>
          </Tooltip>

          <Tooltip id={`close-modal-${src}`} {...tooltipProps}>
            <span className="tw-text-xs">Close</span>
          </Tooltip>
        </>
      )}
    </div>
  );

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
        />
      </button>

      {!loaded && (
        <div className="tw-sr-only" aria-live="polite">
          Loading image
        </div>
      )}

      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
}
