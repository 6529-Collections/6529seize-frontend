"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { faCompress } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FocusTrap } from "focus-trap-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, type MouseEvent } from "react";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import type { MemesDropMedia } from "./memesDropPanelTypes";

interface MemesDropFullscreenOverlayProps {
  readonly isOpen: boolean;
  readonly artworkMedia?: MemesDropMedia | null | undefined;
  readonly drop: ExtendedDrop;
  readonly title: string;
  readonly description: string;
  readonly onClose: () => void;
}

export function MemesDropFullscreenOverlay({
  isOpen,
  artworkMedia,
  drop,
  title,
  description,
  onClose,
}: MemesDropFullscreenOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isOverlayVisible = isOpen && !!artworkMedia;

  useEffect(() => {
    if (!isOverlayVisible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverlayVisible, onClose]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    onClose();
  };

  return (
    <FocusTrap
      active={isOverlayVisible}
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        fallbackFocus: () => dialogRef.current ?? document.body,
        initialFocus: () =>
          closeButtonRef.current ?? dialogRef.current ?? document.body,
        returnFocusOnDeactivate: true,
      }}
    >
      <div>
        <AnimatePresence>
          {isOverlayVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-iron-950/90 tw-p-4"
              onClick={handleBackdropClick}
            >
              <dialog
                ref={dialogRef}
                open
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                aria-modal="true"
                tabIndex={-1}
                className="tw-static tw-m-0 tw-flex tw-h-full tw-max-h-full tw-w-full tw-max-w-5xl tw-flex-col tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-iron-100"
              >
                <div className="tw-mb-4 tw-flex tw-w-full tw-items-center tw-justify-between">
                  <div className="tw-flex tw-flex-col">
                    <div className="tw-flex tw-items-center tw-gap-x-3">
                      <SingleWaveDropPosition
                        rank={drop.rank ?? 1}
                        drop={drop}
                      />
                      <h3
                        id={titleId}
                        className="tw-text-xl tw-font-semibold tw-text-iron-100"
                      >
                        {title}
                      </h3>
                    </div>
                    {description && (
                      <p
                        id={descriptionId}
                        className="tw-ml-10 tw-mt-1 tw-text-md tw-text-iron-400"
                      >
                        {description}
                      </p>
                    )}
                  </div>

                  <div className="tw-mx-auto">
                    <SingleWaveDropVotes drop={drop} />
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className="tw-rounded-lg tw-bg-iron-900/80 tw-p-3 tw-text-iron-100 tw-transition-colors tw-duration-200 hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
                    aria-label="Exit fullscreen view"
                  >
                    <FontAwesomeIcon
                      icon={faCompress}
                      className="tw-h-5 tw-w-5"
                    />
                  </button>
                </div>

                <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Drop media URLs can be arbitrary user-hosted assets. */}
                  <img
                    src={artworkMedia.url}
                    alt={title}
                    className="tw-max-h-full tw-max-w-full tw-object-contain"
                  />
                </div>
              </dialog>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FocusTrap>
  );
}
