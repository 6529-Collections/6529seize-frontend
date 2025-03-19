import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MemesArtSubmission from "./MemesArtSubmission";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";

interface MemesArtSubmissionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (artwork: {
    imageUrl: string;
    traits: {
      // Text fields
      artist: string;
      palette: string;
      style: string;
      jewel: string;
      superpower: string;
      dharma: string;
      gear: string;
      clothing: string;
      element: string;
      mystery: string;
      secrets: string;
      weapon: string;
      home: string;
      parent: string;
      sibling: string;
      food: string;
      drink: string;

      // Boolean fields
      punk6529: boolean;
      gradient: boolean;
      movement: boolean;
      dynamic: boolean;
      interactive: boolean;
      collab: boolean;
      om: boolean;
      threeD: boolean;
      pepe: boolean;
      gm: boolean;
      bonus: boolean;
      boost: boolean;
      summer: boolean;
      tulip: boolean;

      // Dropdown fields
      memeName: string;

      // Number fields
      pointsPower: number;
      pointsWisdom: number;
      pointsLoki: number;
      pointsSpeed: number;

      // Read-only fields
      seizeArtistProfile: string;
      typeCard: string;
      issuanceMonth: string;
      typeSeason: number;
      typeMeme: number;
      typeCardNumber: number;
    };
    signature: string;
  }) => void;
}

export const MemesArtSubmissionModal: React.FC<
  MemesArtSubmissionModalProps
> = ({ isOpen, onClose, onSubmit }) => {
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
              <MemesArtSubmission onCancel={onClose} onSubmit={onSubmit} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MemesArtSubmissionModal;
