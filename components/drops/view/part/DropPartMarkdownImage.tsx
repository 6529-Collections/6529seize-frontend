"use client";

import { faExpand, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { fullScreenSupported } from "../../../../helpers/Helpers";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Link from "next/link";
import useCapacitor from "../../../../hooks/useCapacitor";
import {
  ImageScale,
  getScaledImageUri,
} from "../../../../helpers/image.helpers";
import { Tooltip } from "react-tooltip";

const tooltipProps = {
  delayShow: 250,
  place: "top" as const,
  style: { backgroundColor: "#37373E", color: "white", zIndex: 1002 },
};

const modalButtonClasses =
  "tw-flex tw-items-center tw-justify-center tw-border-0 tw-text-iron-50 tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 tw-rounded-full tw-size-10 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out";

interface DropPartMarkdownImageProps {
  readonly src: string;
  readonly alt?: string;
}

const DropPartMarkdownImage: React.FC<DropPartMarkdownImageProps> = ({
  src,
  alt = "Seize",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const { isCapacitor } = useCapacitor();

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

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
        | React.MouseEvent<HTMLButtonElement>
        | React.MouseEvent<HTMLDivElement>
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

  useKeyPressEvent("Escape", () => handleCloseModal());

  const modalContent = (
    <div
      className="tailwind-scope tw-cursor-default tw-relative tw-z-1000"
      onClick={handleCloseModal}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}>
      <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-80 tw-pointer-events-none"></div>
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(e) => setIsZoomed(e.state.scale > 1)}>
        {({ resetTransform }) => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-hidden tw-flex tw-items-center tw-justify-center">
            <div className="tw-relative tw-flex tw-flex-col lg:tw-flex-row tw-max-w-[95vw] tw-max-h-[90vh]">
              <div
                role="button"
                className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-flex-1 tw-min-h-0 tw-min-w-0"
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}>
                <TransformComponent
                  wrapperClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  contentClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
                  <img
                    src={src}
                    alt={alt}
                    style={{ pointerEvents: "auto" }}
                    className="tw-max-h-[75vh] lg:tw-max-h-[90vh] tw-max-w-full tw-object-contain"
                  />
                </TransformComponent>
              </div>

              <div className="tw-fixed tw-top-2 tw-right-4 tw-flex tw-flex-row tw-gap-x-4 tw-z-[1001] tw-pt-[env(safe-area-inset-top,0px)] lg:tw-relative lg:tw-top-0 lg:tw-right-auto lg:tw-flex-col-reverse lg:tw-gap-x-0 lg:tw-gap-y-2 lg:tw-ml-4 lg:tw-pt-0 lg:tw-self-start">
                {isZoomed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTransform();
                      setIsZoomed(false);
                    }}
                    data-tooltip-id="reset-zoom-markdown"
                    className={modalButtonClasses}
                    aria-label="Reset">
                    <FontAwesomeIcon
                      icon={faRotateLeft}
                      className="tw-size-4"
                    />
                  </button>
                )}
                <Link href={src} target="_blank" rel="noopener noreferrer">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    data-tooltip-id={`open-browser-markdown-${src}`}
                    className={modalButtonClasses}
                    aria-label="Open image in new tab">
                    <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  </button>
                </Link>
                {fullScreenSupported() && !isCapacitor && (
                  <button
                    onClick={handleFullScreen}
                    data-tooltip-id="full-screen-markdown"
                    className={modalButtonClasses}
                    aria-label="Full screen">
                    <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  data-tooltip-id="close-modal-markdown"
                  className={modalButtonClasses}
                  aria-label="Close modal">
                  <svg
                    className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true">
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
          <Tooltip id={`open-browser-markdown-${src}`} {...tooltipProps}>
            <span className="tw-text-xs">Open in Browser</span>
          </Tooltip>

          <Tooltip id="full-screen-markdown" {...tooltipProps}>
            <span className="tw-text-xs">Full screen</span>
          </Tooltip>

          <Tooltip id="reset-zoom-markdown" {...tooltipProps}>
            <span className="tw-text-xs">Reset zoom</span>
          </Tooltip>

          <Tooltip id="close-modal-markdown" {...tooltipProps}>
            <span className="tw-text-xs">Close</span>
          </Tooltip>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="tw-flex tw-mt-2">
        {isLoading && ( 
          <div className="tw-absolute tw-inset-0 tw-bg-iron-800 tw-animate-pulse tw-rounded-xl tw-h-80"></div>
        )}
        <img
          ref={imgRef}
          src={getScaledImageUri(src, ImageScale.AUTOx450)}
          alt={alt}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
          className={`tw-object-center tw-object-contain tw-max-w-full tw-h-80 tw-cursor-pointer ${
            isLoading ? "tw-opacity-0" : "tw-opacity-100"
          }`}
          {...props}
        />
      </div>
      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
};

export default React.memo(DropPartMarkdownImage);
