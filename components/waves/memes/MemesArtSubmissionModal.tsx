import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import MemesArtSubmission from "./MemesArtSubmission";
import { createPortal } from "react-dom";

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

export const MemesArtSubmissionModal: React.FC<MemesArtSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="tw-fixed tw-inset-0 tw-z-50 tw-overflow-y-auto tw-bg-iron-950/90 tw-flex tw-flex-col"
        >
          <div className="tw-h-full tw-w-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
            <div className="tw-container tw-mx-auto tw-h-full">
              <MemesArtSubmission
                onCancel={onClose}
                onSubmit={onSubmit}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MemesArtSubmissionModal;