import { faExpand, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const { isCapacitor } = useCapacitor();

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    if (imgRef.current) {
      setNaturalSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
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
      <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-80 tw-backdrop-blur-[1px]"></div>
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(e) => setIsZoomed(e.state.scale > 1)}>
        {({ resetTransform }) => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-hidden tw-flex tw-items-center tw-justify-center">
            <div className="tw-relative tw-max-w-[95vw] tw-max-h-[95vh] tw-m-4">
              <div className="tw-flex tw-flex-row-reverse lg:tw-flex-col tw-gap-2 tw-items-center tw-absolute -tw-top-12 lg:tw-top-0 tw-right-0 lg:-tw-right-12">
                <button
                  onClick={handleCloseModal}
                  className="tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-z-10 tw-bg-white/10 hover:tw-bg-white/20 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                  aria-label="Close modal">
                  <svg
                    className="tw-h-6 tw-w-6 tw-flex-shrink-0"
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
                {fullScreenSupported() && !isCapacitor && (
                  <button
                    onClick={handleFullScreen}
                    className="tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-z-10 tw-bg-white/10 hover:tw-bg-white/20 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Full screen">
                    <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                  </button>
                )}
                {isZoomed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTransform();
                      setIsZoomed(false);
                    }}
                    className="tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-z-10 tw-bg-white/10 hover:tw-bg-white/20 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Reset">
                    <FontAwesomeIcon
                      icon={faRotateLeft}
                      className="tw-size-4"
                    />
                  </button>
                )}
              </div>
              <div
                role="button"
                className="tw-flex tw-flex-col tw-items-center"
                onClick={(e) => e.stopPropagation()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}>
                <TransformComponent>
                  <img
                    src={src}
                    alt={alt}
                    className="tw-max-w-[90vw] tw-max-h-[calc(100vh-120px)] lg:tw-max-h-[calc(100vh-60px)] tw-object-contain"
                    style={{
                      pointerEvents: "auto",
                    }}
                  />
                </TransformComponent>
                <Link href={src} target="_blank" rel="noopener noreferrer">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="tw-mt-2 tw-whitespace-nowrap tw-text-sm tw-border-0 tw-bg-iron-800 tw-text-iron-200 tw-rounded-full tw-py-1 tw-px-3 tw-opacity-70 hover:tw-opacity-100 tw-transition-opacity tw-duration-300"
                    aria-label="Open image in new tab">
                    Open in Browser
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
    </div>
  );

  return (
    <>
      <div className="tw-relative tw-w-full sm:tw-max-w-lg tw-mt-2 tw-flex">
        {isLoading && (
          <div
            className="tw-absolute tw-inset-0 tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
            style={{
              paddingBottom: `${Math.min(
                (1 / (naturalSize.width / naturalSize.height)) * 100,
                70
              )}%`,
              maxHeight: "70vh",
            }}></div>
        )}
        <img
          ref={imgRef}
          src={getScaledImageUri(src, ImageScale.AUTOx450)}
          alt={alt}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
          className={`tw-object-center tw-object-contain ${
            isLoading ? "tw-opacity-0" : "tw-opacity-100"
          } tw-cursor-pointer`}
          style={{
            width: naturalSize.width > 0 ? `${naturalSize.width}px` : "100%",
            maxWidth: "100%",
            height: "auto",
            maxHeight: "70vh",
          }}
          {...props}
        />
      </div>
      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
};

export default React.memo(DropPartMarkdownImage);
