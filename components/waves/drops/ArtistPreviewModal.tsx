import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import { ApiProfileMin } from "../../../generated/models/ApiProfileMin";
import { ArtistPreviewModalContent } from "./ArtistPreviewModalContent";
import ArtistPreviewAppWrapper from "./ArtistPreviewAppWrapper";

export type ModalTab = "active" | "winners";

interface ArtistPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
  readonly initialTab?: ModalTab;
}

export const ArtistPreviewModal: React.FC<
  ArtistPreviewModalProps
> = ({ isOpen, onClose, user, initialTab = "active" }) => {
  const { isApp } = useDeviceInfo();
  const modalRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  
  // Check if user has winning artworks
  const hasWinningArtworks = user.winner_main_stage_drop_ids && 
                             user.winner_main_stage_drop_ids.length > 0;
  
  // Reset tab when modal opens with different initial tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Cleanup body overflow and manage focus
  useEffect(() => {
    if (isOpen && !isApp) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Set body overflow
      document.body.style.overflow = 'hidden';
      
      // Focus the modal after animation
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
      
      return () => {
        document.body.style.overflow = 'unset';
        // Restore previous focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, isApp]);

  if (!isOpen) return null;

  // Use app wrapper for mobile apps
  if (isApp) {
    return (
      <ArtistPreviewAppWrapper isOpen={isOpen} onClose={onClose}>
        <ArtistPreviewModalContent
          user={user}
          isOpen={isOpen}
          onClose={onClose}
          isApp={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasWinningArtworks={hasWinningArtworks}
        />
      </ArtistPreviewAppWrapper>
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
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div 
          className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-z-[100] tw-backdrop-blur-[1px]"
          onClick={onClose}
        ></div>

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div 
          className="tw-fixed tw-inset-0 tw-z-[100] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
          onClick={onClose}
        >
          <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4">
            <motion.dialog
              ref={modalRef}
              initial={modalVariants.initial}
              animate={modalVariants.animate}
              exit={modalVariants.exit}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="tw-relative tw-w-full tw-max-w-5xl tw-max-h-[90vh] sm:tw-max-h-[85vh] tw-rounded-xl tw-bg-iron-950 tw-border tw-border-iron-800 tw-overflow-hidden tw-shadow-2xl tw-shadow-black/25 tw-m-0 tw-p-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
              open
              aria-label="Artist submissions gallery"
            >
              <ArtistPreviewModalContent
                user={user}
                isOpen={isOpen}
                onClose={onClose}
                isApp={false}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hasWinningArtworks={hasWinningArtworks}
              />
            </motion.dialog>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
