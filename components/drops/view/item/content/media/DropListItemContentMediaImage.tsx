"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import { fullScreenSupported } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useInView } from "@/hooks/useInView";
import { faExpand, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
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

function DropListItemContentMediaImage({
  src,
  maxRetries = 0,
  onContainerClick,
  isCompetitionDrop = false,
  disableModal = false,
  imageObjectPosition,
  imageScale = ImageScale.AUTOx450,
}: {
  readonly src: string;
  readonly maxRetries?: number | undefined;
  readonly onContainerClick?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly disableModal?: boolean | undefined;
  readonly imageObjectPosition?: string | undefined;
  readonly imageScale?: ImageScale | undefined;
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
  const { isCapacitor } = useCapacitor();

  const handleImageLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (errorCount >= maxRetries) return; // give up – show fallback
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

  const handleFullScreen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const fullscreenTarget = modalImageRef.current ?? imgRef.current;
      if (fullscreenTarget) {
        fullscreenTarget.requestFullscreen();
      }
    },
    []
  );

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

  useKeyPressEvent("Escape", () => {
    if (!disableModal) {
      handleCloseModal();
    }
  });

  const modalContent = (
    <div
      className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default"
      onClick={handleCloseModal}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="tw-pointer-events-none tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-80"></div>
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(e) => setIsZoomed(e.state.scale > 1)}
      >
        {({ resetTransform }) => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
            <div className="tw-relative tw-flex tw-max-h-[90vh] tw-max-w-[95vw] tw-flex-col lg:tw-flex-row">
              <div
                role="button"
                className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center"
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                aria-label="Full size drop media"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}
              >
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

              <div className="tw-fixed tw-right-4 tw-top-2 tw-z-[1001] tw-flex tw-flex-row tw-gap-x-4 tw-pt-[env(safe-area-inset-top,0px)] lg:tw-relative lg:tw-right-auto lg:tw-top-0 lg:tw-ml-4 lg:tw-flex-col-reverse lg:tw-gap-x-0 lg:tw-gap-y-2 lg:tw-self-start lg:tw-pt-0">
                {isZoomed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTransform();
                      setIsZoomed(false);
                    }}
                    data-tooltip-id="reset-zoom"
                    className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700"
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
                    onClick={(e) => e.stopPropagation()}
                    data-tooltip-id={`open-browser-${src}`}
                    className={modalButtonClasses}
                    aria-label="Open image in new tab"
                  >
                    <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                </Link>
                {fullScreenSupported() && !isCapacitor && (
                  <button
                    onClick={handleFullScreen}
                    data-tooltip-id="full-screen"
                    className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700"
                    aria-label="Full screen"
                  >
                    <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                  </button>
                )}
                {onContainerClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseModal();
                      onContainerClick();
                    }}
                    data-tooltip-id="view-drop-details"
                    className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-700"
                    aria-label="View drop details"
                  >
                    <InformationCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                )}

                <button
                  onClick={handleCloseModal}
                  data-tooltip-id="close-modal"
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

      {/* Tooltips inside modal */}
      {!isCapacitor && (
        <>
          <Tooltip id={`open-browser-${src}`} {...tooltipProps}>
            <span className="tw-text-xs">Open in Browser</span>
          </Tooltip>

          <Tooltip id="full-screen" {...tooltipProps}>
            <span className="tw-text-xs">Full screen</span>
          </Tooltip>

          <Tooltip id="view-drop-details" {...tooltipProps}>
            <span className="tw-text-xs">View Drop details</span>
          </Tooltip>

          <Tooltip id="reset-zoom" {...tooltipProps}>
            <span className="tw-text-xs">Reset zoom</span>
          </Tooltip>

          <Tooltip id="close-modal" {...tooltipProps}>
            <span className="tw-text-xs">Close</span>
          </Tooltip>
        </>
      )}
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
        {!loaded && errorCount <= maxRetries && (
          <div
            className={`tw-rounded-xl tw-bg-iron-800 ${
              hasTouchScreen ? "" : "tw-animate-pulse"
            }`}
            style={loadingPlaceholderStyle}
          />
        )}

        {inView && errorCount <= maxRetries && (
          <FallbackImage
            key={retryTick}
            ref={imgRef}
            primarySrc={getScaledImageUri(src, imageScale)}
            fallbackSrc={src}
            alt="Drop media"
            fill
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
