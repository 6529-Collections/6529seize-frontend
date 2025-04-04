import React, { useRef, useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import WaveLeaderboardGalleryItemVotes from "./WaveLeaderboardGalleryItemVotes";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Link from "next/link";
import WinnerDropBadge from "../../drops/winner/WinnerDropBadge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { fullScreenSupported } from "../../../../helpers/Helpers";
import useCapacitor from "../../../../hooks/useCapacitor";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";

interface WaveLeaderboardGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardGalleryItem: React.FC<
  WaveLeaderboardGalleryItemProps
> = ({ drop, onDropClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { isCapacitor } = useCapacitor();

  const handleImageClick = () => {
    onDropClick(drop);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFullScreen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (imgRef.current) {
      imgRef.current.requestFullscreen();
    }
  };

  useKeyPressEvent("Escape", handleCloseModal);

  const modalContent = isModalOpen ? (
    <div
      className="tailwind-scope tw-cursor-default tw-relative tw-z-1000"
      onClick={handleCloseModal}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-80 tw-backdrop-blur-[1px] tw-pointer-events-none"></div>
      <TransformWrapper
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(e) => setIsZoomed(e.state.scale > 1)}
      >
        {({ resetTransform }) => (
          <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-hidden tw-flex tw-items-center tw-justify-center">
            <div className="tw-relative tw-max-w-[95vw] tw-max-h-[95vh] tw-m-4">
              <div className="tw-flex tw-flex-row-reverse lg:tw-flex-col tw-gap-2 tw-items-center tw-absolute -tw-top-12 lg:tw-top-0 tw-right-0 lg:-tw-right-12">
                <button
                  onClick={handleCloseModal}
                  className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-absolute -tw-top-12 lg:tw-top-0 tw-right-0 lg:-tw-right-12 tw-text-iron-300 hover:tw-text-iron-50 tw-z-10 tw-bg-white/10 hover:tw-bg-white/20 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
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
                {fullScreenSupported() && !isCapacitor && (
                  <button
                    onClick={handleFullScreen}
                    className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-absolute -tw-top-12 tw-right-10 lg:tw-top-10 lg:-tw-right-12 tw-text-iron-300 hover:tw-text-iron-50 tw-z-10 tw-bg-white/10 hover:tw-bg-white/20 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-backdrop-blur-sm tw-transition-all tw-duration-300 tw-ease-out"
                    aria-label="Full screen"
                  >
                    <FontAwesomeIcon icon={faExpand} className="tw-size-4 tw-flex-shrink-0" />
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
                    aria-label="Reset"
                  >
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
                }}
              >
                <TransformComponent>
                  <img
                    ref={imgRef}
                    src={drop.parts[0].media[0].url}
                    alt="Full size drop media"
                    className="tw-max-w-full tw-max-h-[calc(100vh-120px)] lg:tw-max-h-[calc(100vh-60px)] tw-object-contain"
                    style={{
                      pointerEvents: "auto",
                    }}
                  />
                </TransformComponent>
                <div className="tw-flex tw-gap-2 tw-mt-2">
                  <Link
                    href={drop.parts[0].media[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="tw-whitespace-nowrap tw-text-sm tw-border-0 tw-bg-iron-800 tw-text-iron-200 tw-rounded-full tw-py-1 tw-px-3 tw-opacity-70"
                      aria-label="Open image in new tab"
                    >
                      Open in Browser
                    </button>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseModal();
                      onDropClick(drop);
                    }}
                    className="tw-whitespace-nowrap tw-text-sm tw-border-0 tw-bg-iron-700 tw-text-iron-200 tw-rounded-full tw-py-1 tw-px-3 tw-opacity-70"
                    aria-label="View drop details"
                  >
                    View Drop Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
    </div>
  ) : null;

  return (
    <div>
      <div
        className="tw-aspect-square tw-bg-iron-800 tw-border tw-border-iron-800 tw-overflow-hidden tw-relative tw-cursor-pointer"
        onClick={handleImageClick}
      >
        <div
          className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center hover:tw-scale-105 supports-[hover]:hover:tw-scale-105 tw-transform tw-duration-300 tw-ease-out touch-none"
          onClick={(e) => {
            e.stopPropagation();
            handleImageClick();
          }}
        >
          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
            <DropListItemContentMedia
              media_mime_type={drop.parts[0].media[0].mime_type || "image/jpeg"}
              media_url={getScaledImageUri(
                drop.parts[0].media[0].url,
                ImageScale.AUTOx450
              )}
              onContainerClick={() => {
                // This prevents the default modal from opening in DropListItemContentMedia
                // and lets the parent div's onClick handle navigation instead
              }}
            />
            {/* Overlay div to intercept clicks so DropListItemContentMedia doesn't open its own modal */}
            <div
              className="tw-absolute tw-inset-0 tw-z-[1]"
              onClick={(e) => {
                e.stopPropagation();
                handleImageClick();
              }}
            />
          </div>
        </div>
        <button
          className="tw-absolute tw-bottom-2 tw-right-2 tw-bg-black/40 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-iron-50 tw-rounded-full tw-size-8 tw-flex tw-items-center tw-justify-center tw-border-0 tw-transition-none md:tw-transition tw-duration-300 tw-ease-out tw-backdrop-blur-sm tw-z-10 touch-none"
          onClick={handleExpandClick}
          aria-label="View image"
        >
          <FontAwesomeIcon icon={faExpand} className="tw-size-3.5 tw-flex-shrink-0" />
        </button>
      </div>
      <div className="tw-flex tw-flex-col tw-mt-2 tw-gap-y-2">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <WinnerDropBadge
              rank={drop.rank}
              decisionTime={drop.winning_context?.decision_time || null}
            />
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/${drop.author?.handle}`}
              className="tw-text-sm tw-text-iron-200 tw-truncate tw-no-underline tw-font-medium"
            >
              {drop.author?.handle || " "}
            </Link>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
          <WaveLeaderboardGalleryItemVotes drop={drop} />

          <div className="tw-flex tw-items-center tw-gap-x-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.25"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-size-4 tw-text-iron-400 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
            <span className="tw-text-sm tw-font-medium tw-text-iron-200">
              {formatNumberWithCommas(drop.raters_count)}
            </span>
          </div>
        </div>
      </div>
      {isModalOpen && createPortal(modalContent, document.body)}
    </div>
  );
};
