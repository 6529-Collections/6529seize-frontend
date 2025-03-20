import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import { ApiWave } from "../../../generated/models/ApiWave";
import MemesArtSubmissionContainer from "./submission/MemesArtSubmissionContainer";

interface MemesArtSubmissionModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

export const MemesArtSubmissionModal: React.FC<
  MemesArtSubmissionModalProps
> = ({ isOpen, wave, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => onClose());
  useKeyPressEvent("Escape", () => onClose());

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="tailwind-scope tw-fixed tw-inset-0 tw-z-50 tw-bg-iron-700/80 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center"
        >
          <div
            className="tw-w-full tw-max-w-4xl tw-overflow-hidden tw-rounded-xl"
            ref={modalRef}
          >
            <div className="tw-max-h-[95vh] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
              <MemesArtSubmissionContainer onClose={onClose} wave={wave} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MemesArtSubmissionModal;
