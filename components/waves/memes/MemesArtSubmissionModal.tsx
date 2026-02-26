"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { useKeyPressEvent } from "react-use";

import type { ApiWave } from "@/generated/models/ApiWave";

import MemesArtSubmissionContainer from "./submission/MemesArtSubmissionContainer";

interface MemesArtSubmissionModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

const MemesArtSubmissionModal: React.FC<MemesArtSubmissionModalProps> = ({
  isOpen,
  wave,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useKeyPressEvent("Escape", () => onClose());

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-overflow-hidden tw-bg-gray-600/80 tw-backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center md:tw-inset-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              data-testid="memes-art-submission-modal-panel"
              className="tw-flex tw-h-[100dvh] tw-max-h-[100dvh] tw-w-full tw-flex-col md:tw-h-full md:tw-max-h-none"
              ref={modalRef}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
                <MemesArtSubmissionContainer onClose={onClose} wave={wave} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MemesArtSubmissionModal;
