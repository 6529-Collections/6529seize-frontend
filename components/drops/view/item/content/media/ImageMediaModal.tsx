"use client";

import React, { useState } from "react";
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
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  useKeyPressEvent("Escape", onClose);

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
        panning={{ disabled: true }}
        limitToBounds={!isZoomed}
        smooth
        onZoom={(event) => setIsZoomed(event.state.scale > 1)}
      >
        {() => (
          <div
            className="tw-pointer-events-none tw-fixed tw-inset-0 tw-z-[1001] tw-flex tw-items-center tw-justify-center tw-overflow-hidden"
          >
            <div className="tw-pointer-events-auto tw-relative tw-flex tw-h-[90dvh] tw-w-[95vw] tw-flex-col">
              <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center">
                <TransformComponent
                  wrapperClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  contentClass="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
                  wrapperStyle={{ width: "95vw", height: "90dvh" }}
                  contentStyle={{ width: "95vw", height: "90dvh" }}
                >
                  <img
                    ref={imageRef}
                    src={src}
                    alt="Full size drop media"
                    style={{
                      height: "90dvh",
                      maxHeight: "90dvh",
                      maxWidth: "95vw",
                      pointerEvents: "auto",
                      width: "95vw",
                    }}
                    className="tw-h-full tw-w-full tw-object-contain"
                  />
                </TransformComponent>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>
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
