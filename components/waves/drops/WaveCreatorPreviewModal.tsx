"use client";

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { createPortal } from "react-dom";

import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import ArtistPreviewAppWrapper from "./ArtistPreviewAppWrapper";
import { WaveCreatorPreviewModalContent } from "./WaveCreatorPreviewModalContent";

interface WaveCreatorPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
}

export const WaveCreatorPreviewModal = ({
  isOpen,
  onClose,
  user,
}: WaveCreatorPreviewModalProps) => {
  const { isApp } = useDeviceInfo();

  useEffect(() => {
    if (!isOpen || isApp) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isApp]);

  if (!isOpen) return null;

  if (isApp) {
    return (
      <ArtistPreviewAppWrapper isOpen={isOpen} onClose={onClose}>
        <WaveCreatorPreviewModalContent
          user={user}
          isOpen={isOpen}
          onClose={onClose}
          isApp
        />
      </ArtistPreviewAppWrapper>
    );
  }

  return createPortal(
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tw-relative tw-z-[9999] tw-cursor-default"
        onClose={() => {}}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-200 tw-ease-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-200 tw-ease-in"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div
            className="tw-fixed tw-inset-0 tw-bg-iron-600/60"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-z-[100] tw-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-block">
          <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4">
            <TransitionChild
              as={Fragment}
              enter="tw-duration-0"
              enterFrom="tw-opacity-100"
              enterTo="tw-opacity-100"
              leave="tw-duration-0"
              leaveFrom="tw-opacity-100"
              leaveTo="tw-opacity-100"
            >
              <DialogPanel
                className="tw-relative tw-m-0 tw-max-h-[90vh] tw-w-full tw-max-w-3xl tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-0 tw-shadow-2xl tw-shadow-black/25"
                onClick={(e) => e.stopPropagation()}
              >
                <WaveCreatorPreviewModalContent
                  user={user}
                  isOpen={isOpen}
                  onClose={onClose}
                  isApp={false}
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>

        <div className="tw-fixed tw-inset-0 tw-block tw-overflow-hidden sm:tw-hidden">
          <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
            <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
              <TransitionChild
                as={Fragment}
                enter="tw-transform tw-transition tw-duration-300 tw-ease-out"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-transform tw-transition tw-duration-300 tw-ease-in"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full"
              >
                <DialogPanel
                  className="tw-pointer-events-auto tw-relative tw-max-h-[90vh] tw-w-screen tw-transform-gpu tw-overflow-hidden tw-rounded-t-xl tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/25 tw-will-change-transform"
                  onClick={(e) => e.stopPropagation()}
                >
                  <WaveCreatorPreviewModalContent
                    user={user}
                    isOpen={isOpen}
                    onClose={onClose}
                    isApp={false}
                  />
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>,
    document.body
  );
};
