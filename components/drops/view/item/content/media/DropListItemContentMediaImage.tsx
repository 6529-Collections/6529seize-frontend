import { faExpand, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { fullScreenSupported } from "../../../../../../helpers/Helpers";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Link from "next/link";
import useCapacitor from "../../../../../../hooks/useCapacitor";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";
import { useInView } from "../../../../../../hooks/useInView";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

function DropListItemContentMediaImage({
  src,
  maxRetries = 0,
  onContainerClick,
}: {
  readonly src: string;
  readonly maxRetries?: number;
  readonly onContainerClick?: () => void;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryTick, setRetryTick] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);
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
      if (imgRef.current) {
        imgRef.current.requestFullscreen();
      }
    },
    [imgRef]
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

  useKeyPressEvent("Escape", () => handleCloseModal());

  const modalContent = (
    <div
      className="tailwind-scope tw-cursor-default tw-relative tw-z-1000"
      onClick={handleCloseModal}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-80 tw-pointer-events-none"></div>
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(e) => setIsZoomed(e.state.scale > 1)}
      >
        {({ resetTransform }) => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-hidden tw-flex tw-items-center tw-justify-center">
            {/* Mobile: Fixed buttons at top */}
            <div className="lg:tw-hidden tw-fixed tw-top-2 tw-right-4 tw-flex tw-flex-row tw-gap-x-4 tw-z-[1001] tw-pt-[env(safe-area-inset-top,0px)]">
              <Tippy
                content={<span className="tw-text-xs">Open in Browser</span>}
                disabled={isCapacitor}
                trigger="mouseenter"
                placement="bottom"
              >
                <Link href={src} target="_blank" rel="noopener noreferrer">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 desktop-hover:hover:tw-text-iron-400 tw-bg-iron-800 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Open image in new tab"
                  >
                    <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                </Link>
              </Tippy>
              {fullScreenSupported() && !isCapacitor && (
                <Tippy
                  content={<span className="tw-text-xs">Full screen</span>}
                  disabled={isCapacitor}
                  trigger="mouseenter"
                  placement="bottom"
                >
                  <button
                    onClick={handleFullScreen}
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 desktop-hover:hover:tw-text-iron-400 tw-bg-iron-800 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Full screen"
                  >
                    <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                  </button>
                </Tippy>
              )}
              {onContainerClick && (
                <Tippy
                  content={
                    <span className="tw-text-xs">View Drop details</span>
                  }
                  disabled={isCapacitor}
                  trigger="mouseenter"
                  placement="bottom"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseModal();
                      onContainerClick();
                    }}
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 desktop-hover:hover:tw-text-iron-400 tw-bg-iron-800 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="View drop details"
                  >
                    <InformationCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                </Tippy>
              )}
              <Tippy
                content={<span className="tw-text-xs">Close</span>}
                disabled={isCapacitor}
                trigger="mouseenter"
                placement="bottom"
              >
                <button
                  onClick={handleCloseModal}
                  className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 desktop-hover:hover:tw-text-iron-400 tw-bg-iron-800 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
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
              </Tippy>
            </div>

            <div className="tw-relative tw-flex tw-flex-col lg:tw-flex-row tw-max-w-[95vw] tw-max-h-[90vh]">
              <div
                role="button"
                className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-flex-1 tw-min-h-0 tw-min-w-0"
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
                    src={src}
                    alt="Full size drop media"
                    className="tw-max-h-[75vh] lg:tw-max-h-[90vh] tw-max-w-full tw-object-contain tw-pointer-events-auto"
                  />
                </TransformComponent>
              </div>

              {/* Desktop: Buttons on the right */}
              <div className="tw-hidden lg:tw-flex tw-flex-col tw-gap-2 tw-ml-4">
                <Tippy
                  content={<span className="tw-text-xs">Close</span>}
                  disabled={isCapacitor}
                  trigger="mouseenter"
                  placement="right"
                >
                  <button
                    onClick={handleCloseModal}
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
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
                </Tippy>
                {fullScreenSupported() && !isCapacitor && (
                  <Tippy
                    content={<span className="tw-text-xs">Full screen</span>}
                    disabled={isCapacitor}
                    trigger="mouseenter"
                    placement="right"
                  >
                    <button
                      onClick={handleFullScreen}
                      className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                      aria-label="Full screen"
                    >
                      <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                    </button>
                  </Tippy>
                )}
                {isZoomed && (
                  <Tippy
                    content={<span className="tw-text-xs">Reset zoom</span>}
                    disabled={isCapacitor}
                    trigger="mouseenter"
                    placement="right"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetTransform();
                        setIsZoomed(false);
                      }}
                      className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                      aria-label="Reset"
                    >
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className="tw-size-4"
                      />
                    </button>
                  </Tippy>
                )}
                <Tippy
                  content={<span className="tw-text-xs">Open in Browser</span>}
                  disabled={isCapacitor}
                  trigger="mouseenter"
                  placement="right"
                >
                  <Link href={src} target="_blank" rel="noopener noreferrer">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                      aria-label="Open image in new tab"
                    >
                      <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                    </button>
                  </Link>
                </Tippy>
                {onContainerClick && (
                  <Tippy
                    content={
                      <span className="tw-text-xs">View Drop details</span>
                    }
                    disabled={isCapacitor}
                    trigger="mouseenter"
                    placement="right"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseModal();
                        onContainerClick();
                      }}
                      className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                      aria-label="View drop details"
                    >
                      <InformationCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                    </button>
                  </Tippy>
                )}
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
    </div>
  );

  return (
    <>
      <div
        ref={ref}
        className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-relative tw-mx-[1px]"
      >
        {!loaded && errorCount <= maxRetries && (
          <div
            className="tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
            style={loadingPlaceholderStyle}
          />
        )}

        {inView && errorCount <= maxRetries && (
          <img
            key={retryTick} // bust cache on each retry
            ref={imgRef}
            src={getScaledImageUri(src, ImageScale.AUTOx450)}
            alt="Drop media"
            className={`tw-object-contain tw-max-w-full tw-max-h-full ${
              !loaded ? "tw-opacity-0" : "tw-opacity-100"
            } tw-cursor-pointer`}
            loading="lazy"
            decoding="async"
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
              className="tw-bg-iron-700 hover:tw-bg-iron-600 tw-text-white tw-px-3 tw-py-1 tw-rounded-md tw-text-xs"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
}

export default React.memo(DropListItemContentMediaImage);
