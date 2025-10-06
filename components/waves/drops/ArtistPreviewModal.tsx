"use client"

import React, { useEffect, useRef, useState, Fragment } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
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


  return createPortal(
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="tw-cursor-default tw-relative tw-z-[9999]" onClose={() => {}}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="tw-ease-out tw-duration-200"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in tw-duration-200"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-backdrop-blur-[1px]" onClick={onClose} />
        </Transition.Child>

        {/* Desktop modal */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="tw-fixed tw-inset-0 tw-z-[100] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-hidden sm:tw-block" onClick={onClose}>
          <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4">
            <Transition.Child
              as={Fragment}
              enter="tw-duration-0"
              enterFrom="tw-opacity-100"
              enterTo="tw-opacity-100"
              leave="tw-duration-0"
              leaveFrom="tw-opacity-100"
              leaveTo="tw-opacity-100"
            >
              <Dialog.Panel className="tw-relative tw-w-full tw-max-w-5xl tw-max-h-[90vh] sm:tw-max-h-[85vh] tw-rounded-xl tw-bg-iron-950 tw-border tw-border-iron-800 tw-overflow-hidden tw-shadow-2xl tw-shadow-black/25 tw-m-0 tw-p-0" onClick={(e) => e.stopPropagation()}>
                <ArtistPreviewModalContent
                  user={user}
                  isOpen={isOpen}
                  onClose={onClose}
                  isApp={false}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  hasWinningArtworks={hasWinningArtworks}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Mobile slide-up modal */}
        <div className="tw-fixed tw-inset-0 tw-overflow-hidden tw-block sm:tw-hidden">
          <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
            <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
              <Transition.Child
                as={Fragment}
                enter="tw-transform tw-transition tw-ease-out tw-duration-300"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-transform tw-transition tw-ease-in tw-duration-300"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full"
              >
                <Dialog.Panel className="tw-pointer-events-auto tw-relative tw-w-screen tw-max-h-[90vh] tw-rounded-t-xl tw-bg-iron-950 tw-border-t tw-border-iron-800 tw-overflow-hidden tw-shadow-2xl tw-shadow-black/25">
                  <ArtistPreviewModalContent
                    user={user}
                    isOpen={isOpen}
                    onClose={onClose}
                    isApp={false}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    hasWinningArtworks={hasWinningArtworks}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>,
    document.body
  );
};
