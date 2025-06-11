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
import { Tooltip } from "react-tooltip";

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

              {/* Action buttons with responsive positioning */}
              <div className="tw-fixed tw-top-2 tw-right-4 tw-flex tw-flex-row tw-gap-x-4 tw-z-[1001] tw-pt-[env(safe-area-inset-top,0px)] lg:tw-relative lg:tw-top-0 lg:tw-right-auto lg:tw-flex-col-reverse lg:tw-gap-x-0 lg:tw-gap-y-2 lg:tw-ml-4 lg:tw-pt-0 lg:tw-self-start">
                <Link href={src} target="_blank" rel="noopener noreferrer">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    data-tooltip-id={`open-browser-${src}`}
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Open image in new tab"
                  >
                    <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                </Link>
                {fullScreenSupported() && !isCapacitor && (
                  <button
                    onClick={handleFullScreen}
                    data-tooltip-id="full-screen"
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
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
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="View drop details"
                  >
                    <InformationCircleIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                )}
                {isZoomed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTransform();
                      setIsZoomed(false);
                    }}
                    data-tooltip-id="reset-zoom"
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Reset"
                  >
                    <FontAwesomeIcon
                      icon={faRotateLeft}
                      className="tw-size-4"
                    />
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  data-tooltip-id="close-modal"
                  className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 lg:tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
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
          <Tooltip
            id={`open-browser-${src}`}
            delayShow={250}
            place="top"
            style={{ backgroundColor: "#37373E", color: "white", zIndex: 1002 }}
          >
            <span className="tw-text-xs">Open in Browser</span>
          </Tooltip>
          
          <Tooltip
            id="full-screen"
            delayShow={250}
            place="top"
            style={{ backgroundColor: "#37373E", color: "white", zIndex: 1002 }}
          >
            <span className="tw-text-xs">Full screen</span>
          </Tooltip>
          
          <Tooltip
            id="view-drop-details"
            delayShow={250}
            place="top"
            style={{ backgroundColor: "#37373E", color: "white", zIndex: 1002 }}
          >
            <span className="tw-text-xs">View Drop details</span>
          </Tooltip>
          
          <Tooltip
            id="reset-zoom"
            delayShow={250}
            place="top"
            style={{ backgroundColor: "#37373E", color: "white", zIndex: 1002 }}
          >
            <span className="tw-text-xs">Reset zoom</span>
          </Tooltip>
          
          <Tooltip
            id="close-modal"
            delayShow={250}
            place="top"
            style={{ backgroundColor: "#37373E", color: "white", zIndex: 1002 }}
          >
            <span className="tw-text-xs">Close</span>
          </Tooltip>
        </>
      )}
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
