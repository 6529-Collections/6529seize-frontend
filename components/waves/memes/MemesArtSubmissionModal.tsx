"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { createPortal } from "react-dom";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import MemesArtSubmissionContainer from "./submission/MemesArtSubmissionContainer";

interface MemesArtSubmissionModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
  readonly sourceDrop?: ExtendedDrop | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

const MemesArtSubmissionModal: React.FC<MemesArtSubmissionModalProps> = ({
  isOpen,
  wave,
  onClose,
  sourceDrop,
  onSourceDropDeleted,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-overflow-hidden tw-bg-gray-600/80 tw-backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center md:tw-inset-4">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              data-testid="memes-art-submission-modal-panel"
              className="tw-flex tw-h-[100dvh] tw-max-h-[100dvh] tw-w-full tw-max-w-screen-xl tw-flex-col md:tw-h-full md:tw-max-h-none"
              ref={modalRef}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
                <MemesArtSubmissionContainer
                  onClose={onClose}
                  wave={wave}
                  sourceDrop={sourceDrop}
                  onSourceDropDeleted={onSourceDropDeleted}
                />
              </div>
            </m.div>
          </div>
        </m.div>
      </AnimatePresence>
    </LazyMotion>,
    document.body
  );
};

export default MemesArtSubmissionModal;
