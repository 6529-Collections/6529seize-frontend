import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useKeyPressEvent } from "react-use";
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

  // We won't use useClickAway since we have our own click handler on the backdrop
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
          className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-bg-iron-700/80 tw-backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          {/* This container uses flexbox to position the modal at bottom on mobile, center on larger screens */}
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center md:tw-items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="tw-w-full tw-max-w-4xl"
              ref={modalRef}
              onClick={(e) => {
                // This is important - stop the click from closing the modal
                e.stopPropagation();
              }}
            >
              <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-shadow-xl tw-max-h-[95vh] tw-flex tw-flex-col">
                <div className="tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-scroll-smooth tw-overscroll-contain">
                  <MemesArtSubmissionContainer onClose={onClose} wave={wave} />
                </div>
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
