import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import { ApiProfileMin } from "../../../generated/models/ApiProfileMin";
import { ArtistActiveSubmissionContent } from "./ArtistActiveSubmissionContent";
import ArtistActiveSubmissionAppWrapper from "./ArtistActiveSubmissionAppWrapper";

interface ArtistSubmissionPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
}

export const ArtistSubmissionPreviewModal: React.FC<
  ArtistSubmissionPreviewModalProps
> = ({ isOpen, onClose, user }) => {
  const { isApp } = useDeviceInfo();

  // Cleanup body overflow on unmount
  useEffect(() => {
    if (isOpen && !isApp) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, isApp]);

  if (!isOpen) return null;

  // Use app wrapper for mobile apps
  if (isApp) {
    return (
      <ArtistActiveSubmissionAppWrapper isOpen={isOpen} onClose={onClose}>
        <ArtistActiveSubmissionContent
          user={user}
          isOpen={isOpen}
          onClose={onClose}
          isApp={true}
        />
      </ArtistActiveSubmissionAppWrapper>
    );
  }

  // Web modal with scale/fade animation
  const modalVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  return createPortal(
    <AnimatePresence>
      <div className="tw-cursor-default tw-relative tw-z-[100]">
        {/* Backdrop - clicking it closes the modal */}
        <div 
          className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-z-[100]"
          onClick={onClose}
        ></div>

        <div 
          className="tw-fixed tw-inset-0 tw-z-[100] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
          onClick={onClose}
        >
          <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4">
            <motion.div
              initial={modalVariants.initial}
              animate={modalVariants.animate}
              exit={modalVariants.exit}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="tw-relative tw-w-full tw-max-w-4xl tw-max-h-[90vh] sm:tw-max-h-[85vh] tw-rounded-xl tw-bg-iron-950 tw-border tw-border-iron-800 tw-overflow-hidden tw-shadow-2xl tw-shadow-black/25"
              onClick={(e) => e.stopPropagation()}
            >
              <ArtistActiveSubmissionContent
                user={user}
                isOpen={isOpen}
                onClose={onClose}
                isApp={false}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
