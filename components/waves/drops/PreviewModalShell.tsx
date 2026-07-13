"use client";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import type { ReactNode } from "react";
import { Fragment, useEffect } from "react";
import { createPortal } from "react-dom";
import ArtistPreviewAppWrapper from "./ArtistPreviewAppWrapper";

interface PreviewModalShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: (isApp: boolean) => ReactNode;
  readonly maxWidth?: "3xl" | "5xl" | undefined;
}

const MAX_WIDTH_CLASS = {
  "3xl": "tw-max-w-3xl",
  "5xl": "tw-max-w-5xl",
} as const;

export const PreviewModalShell = ({
  isOpen,
  onClose,
  children,
  maxWidth = "5xl",
}: PreviewModalShellProps) => {
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();

  useEffect(() => {
    if (!isOpen || isApp) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isApp, onClose]);

  if (!isOpen) {
    return null;
  }

  if (isApp) {
    return (
      <ArtistPreviewAppWrapper isOpen={isOpen} onClose={onClose}>
        {children(true)}
      </ArtistPreviewAppWrapper>
    );
  }

  const stopPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return createPortal(
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tw-relative tw-z-[1000001] tw-cursor-default"
        onClose={() => undefined}
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
          <button
            type="button"
            aria-label={t(locale, "waves.previewModal.close")}
            className="tw-fixed tw-inset-0 tw-border-0 tw-bg-iron-600/60 tw-p-0"
            onClick={(event) => {
              stopPropagation(event);
              onClose();
            }}
          />
        </TransitionChild>

        <div className="tw-pointer-events-none tw-fixed tw-inset-0 tw-z-[100] tw-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-block">
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
                className={`tw-pointer-events-auto tw-relative tw-m-0 tw-max-h-[90vh] tw-w-full ${MAX_WIDTH_CLASS[maxWidth]} tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-0 tw-shadow-2xl tw-shadow-black/25`}
                onClick={stopPropagation}
              >
                {children(false)}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>

        <div className="tw-pointer-events-none tw-fixed tw-inset-0 tw-block tw-overflow-hidden sm:tw-hidden">
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
                  onClick={stopPropagation}
                >
                  {children(false)}
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
