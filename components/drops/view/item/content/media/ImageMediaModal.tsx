"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useKeyPressEvent from "react-use/lib/useKeyPressEvent";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { ExpandedMediaToolbar } from "./MediaActionToolbar";

export function requestCenteredImageFullscreen(
  fullscreenTarget: HTMLImageElement
) {
  const previousObjectPosition = fullscreenTarget.style.objectPosition;

  fullscreenTarget.style.objectPosition = "center";

  const restoreInlinePosition = () => {
    if (document.fullscreenElement === fullscreenTarget) {
      return;
    }

    fullscreenTarget.style.objectPosition = previousObjectPosition;
    document.removeEventListener("fullscreenchange", restoreInlinePosition);
  };

  document.addEventListener("fullscreenchange", restoreInlinePosition);
  fullscreenTarget.requestFullscreen().catch(() => {
    document.removeEventListener("fullscreenchange", restoreInlinePosition);
    fullscreenTarget.style.objectPosition = previousObjectPosition;
  });
}

export function ImageMediaModal({
  src,
  imageRef,
  onClose,
  onOpen,
  openLabel,
  onDownload,
  isDownloading,
  onFullscreen,
  fullscreenTargetAvailable = true,
  gallery,
}: {
  readonly src: string;
  readonly imageRef: React.RefObject<HTMLImageElement | null>;
  readonly onClose: () => void;
  readonly onOpen?: (() => void) | undefined;
  readonly openLabel?: string | undefined;
  readonly onDownload: () => void;
  readonly isDownloading: boolean;
  readonly onFullscreen: () => void;
  readonly fullscreenTargetAvailable?: boolean | undefined;
  readonly gallery?:
    | {
        readonly canGoNext: boolean;
        readonly canGoPrevious: boolean;
        readonly currentIndex: number;
        readonly onNext: () => void;
        readonly onPrevious: () => void;
        readonly total: number;
      }
    | undefined;
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const showGalleryControls = Boolean(gallery && gallery.total > 1);

  useEffect(() => {
    setIsZoomed(false);
  }, [src]);

  const goToPrevious = useCallback(() => {
    if (gallery?.canGoPrevious) {
      gallery.onPrevious();
    }
  }, [gallery]);

  const goToNext = useCallback(() => {
    if (gallery?.canGoNext) {
      gallery.onNext();
    }
  }, [gallery]);

  useKeyPressEvent("Escape", onClose);
  useKeyPressEvent("ArrowLeft", goToPrevious);
  useKeyPressEvent("ArrowRight", goToNext);

  const isPointInsideRenderedImage = (
    image: HTMLImageElement,
    clientX: number,
    clientY: number
  ) => {
    const rect = image.getBoundingClientRect();
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      naturalWidth <= 0 ||
      naturalHeight <= 0
    ) {
      return true;
    }

    const imageAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = rect.width / rect.height;
    const renderedWidth =
      imageAspectRatio > containerAspectRatio
        ? rect.width
        : rect.height * imageAspectRatio;
    const renderedHeight =
      imageAspectRatio > containerAspectRatio
        ? rect.width / imageAspectRatio
        : rect.height;
    const renderedLeft = rect.left + (rect.width - renderedWidth) / 2;
    const renderedTop = rect.top + (rect.height - renderedHeight) / 2;

    return (
      clientX >= renderedLeft &&
      clientX <= renderedLeft + renderedWidth &&
      clientY >= renderedTop &&
      clientY <= renderedTop + renderedHeight
    );
  };

  const handleExpandedImageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    const image = imageRef.current;
    if (!image || event.detail === 0) {
      onClose();
      return;
    }

    if (!isPointInsideRenderedImage(image, event.clientX, event.clientY)) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default"
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close modal"
        data-testid="modal-backdrop"
        onClick={onClose}
        className="tw-fixed tw-inset-0 tw-z-1000 tw-border-0 tw-bg-black/80 tw-p-0"
      />
      <TransformWrapper
        key={src}
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(event) => setIsZoomed(event.state.scale > 1)}
      >
        {() => (
          <div className="tw-pointer-events-none tw-fixed tw-inset-0 tw-z-[1001] tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
            <div className="tw-pointer-events-auto tw-relative tw-flex tw-h-[90dvh] tw-w-[95vw] tw-flex-col">
              <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center">
                <TransformComponent
                  wrapperClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  contentClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  wrapperStyle={{ width: "95vw", height: "90dvh" }}
                  contentStyle={{ width: "95vw", height: "90dvh" }}
                >
                  <button
                    type="button"
                    aria-label="Close modal"
                    className="tw-relative tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-p-0"
                    onClick={handleExpandedImageButtonClick}
                  >
                    {/* Drop media can come from arbitrary hosts outside Next image config. */}
                    <FallbackImage
                      ref={imageRef}
                      primarySrc={src}
                      fallbackSrc={src}
                      alt="Full size drop media"
                      fill
                      sizes="95vw"
                      optimize={false}
                      style={{
                        objectFit: "contain",
                        objectPosition: "center",
                        pointerEvents: "auto",
                      }}
                    />
                  </button>
                </TransformComponent>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
      {showGalleryControls && gallery && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            title="Previous image"
            disabled={!gallery.canGoPrevious}
            onClick={(event) => {
              event.stopPropagation();
              goToPrevious();
            }}
            className="tw-fixed tw-left-3 tw-top-1/2 tw-z-[1101] tw-inline-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-bg-iron-900/95 tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-700 disabled:tw-cursor-default disabled:tw-opacity-40 sm:tw-left-4 sm:tw-size-12"
          >
            <ChevronLeftIcon className="tw-size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            title="Next image"
            disabled={!gallery.canGoNext}
            onClick={(event) => {
              event.stopPropagation();
              goToNext();
            }}
            className="tw-fixed tw-right-3 tw-top-1/2 tw-z-[1101] tw-inline-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-bg-iron-900/95 tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-700 disabled:tw-cursor-default disabled:tw-opacity-40 sm:tw-right-4 sm:tw-size-12"
          >
            <ChevronRightIcon className="tw-size-6" aria-hidden="true" />
          </button>
          <div
            className="tw-fixed tw-left-1/2 tw-z-[1101] -tw-translate-x-1/2 tw-rounded-lg tw-bg-iron-900/95 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur"
            data-testid="image-gallery-counter"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            {gallery.currentIndex + 1} / {gallery.total}
          </div>
        </>
      )}
      <ExpandedMediaToolbar
        onOpen={onOpen}
        openLabel={openLabel}
        onDownload={onDownload}
        isDownloading={isDownloading}
        onFullscreen={onFullscreen}
        fullscreenTargetAvailable={fullscreenTargetAvailable}
        onClose={onClose}
      />
    </div>,
    document.body
  );
}
