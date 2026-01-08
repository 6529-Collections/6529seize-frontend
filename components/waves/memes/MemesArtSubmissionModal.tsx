"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
          className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-bg-gray-600/80 tw-backdrop-blur-sm tw-overflow-hidden"
          onClick={onClose}>
          <div className="tw-fixed tw-inset-2 md:tw-inset-4 tw-flex tw-items-center tw-justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="tw-w-full tw-h-full tw-flex tw-flex-col"
              ref={modalRef}
              onClick={(e) => {
                e.stopPropagation();
              }}>
              <div className="tw-h-full tw-overflow-hidden tw-flex tw-flex-col">
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
