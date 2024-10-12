import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";

function DropListItemContentMediaImage({ src }: { readonly src: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

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
        | React.MouseEvent<HTMLDivElement>
        | React.KeyboardEvent<HTMLDivElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      event?.stopPropagation();
      setIsModalOpen(false);
    },
    []
  );

  const handleOpenInNewTab = useCallback(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const originalSrc = img.src;
      window.open(originalSrc, "_blank");
    };
  }, [src]);

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
    >
      <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-60 tw-backdrop-blur-[1px]"></div>
      <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-hidden tw-flex tw-items-center tw-justify-center">
        <div className="tw-relative tw-max-w-[95vw] tw-max-h-[95vh] tw-m-4">
          <button
            onClick={handleCloseModal}
            className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-absolute -tw-top-12 tw-right-0 lg:tw-top-0 lg:-tw-right-12 tw-text-iron-300 hover:tw-text-iron-50 tw-z-10 tw-bg-white/10 hover:tw-bg-white/20 tw-rounded-full tw-size-8 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
            aria-label="Close modal"
          >
            <svg
              className="tw-h-6 tw-w-6 tw-flex-shrink-0"
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
          <div className="tw-flex tw-flex-col tw-items-center">
            <img
              src={src}
              alt="Full size drop media"
              className="tw-max-w-full tw-max-h-[calc(95vh-60px)] tw-object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInNewTab();
              }}
              className="tw-mt-2 tw-whitespace-nowrap tw-text-sm tw-border-0 tw-bg-iron-800 tw-text-iron-200 tw-rounded-full tw-py-1 tw-px-3 tw-opacity-70 "
              aria-label="Open image in new tab"
            >
              Open in Browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="tw-max-w-lg tw-relative">
        {isLoading && (
          <div
            className="tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
            style={loadingPlaceholderStyle}
          />
        )}
        <img
          ref={imgRef}
          src={src}
          alt="Drop media"
          className={`tw-object-center tw-object-contain ${
            isLoading ? "tw-opacity-0" : "tw-opacity-100"
          } tw-cursor-pointer`}
          style={{
            width: naturalSize.width > 0 ? `${naturalSize.width}px` : "100%",
            maxWidth: "100%",
            height: "auto",
          }}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
        />
      </div>
      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
}

export default React.memo(DropListItemContentMediaImage);
