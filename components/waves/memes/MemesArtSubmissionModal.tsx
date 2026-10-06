"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { Fragment, useMemo } from "react";
import { createPortal } from "react-dom";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import MemesArtSubmissionContainer from "./submission/MemesArtSubmissionContainer";
import { useDropDetailMetadata } from "@/components/waves/drop/useDropDetailMetadata";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

const NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";

interface MemesArtSubmissionModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
  readonly sourceDrop?: ExtendedDrop | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

/** Wait for complete saved metadata before initializing a resubmission, with retry and close available. */
const MemesArtSubmissionModal: React.FC<MemesArtSubmissionModalProps> = ({
  isOpen,
  wave,
  onClose,
  sourceDrop,
  onSourceDropDeleted,
}) => {
  const locale = useBrowserLocale();
  const { metadata, metadataState } = useDropDetailMetadata(sourceDrop, isOpen);
  const hydratedSourceDrop = useMemo(
    () => (sourceDrop && metadata ? { ...sourceDrop, metadata } : undefined),
    [sourceDrop, metadata]
  );
  const dialogTitle = sourceDrop
    ? "Resubmit Work to The Memes"
    : "Submit Work to The Memes";
  let metadataMessageKey: MessageKey = "memes.submission.resubmit.loaded";
  if (metadataState.status === "loading") {
    metadataMessageKey = "memes.submission.resubmit.loading";
  } else if (metadataState.status === "error") {
    metadataMessageKey = "memes.submission.resubmit.loadError";
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1020] tw-overflow-hidden"
        onClose={onClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-transition-opacity tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-transition-opacity tw-duration-150 tw-ease-in motion-reduce:tw-transition-none"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <DialogBackdrop
            data-testid="memes-art-submission-modal-backdrop"
            className="tw-fixed tw-inset-0 tw-bg-gray-600/80 tw-backdrop-blur-sm"
          />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center md:tw-inset-4 md:tw-items-center">
          <TransitionChild
            as={Fragment}
            enter="tw-transition-opacity tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
            enterFrom="tw-opacity-0"
            enterTo="tw-opacity-100"
            leave="tw-transition-opacity tw-duration-150 tw-ease-in motion-reduce:tw-transition-none"
            leaveFrom="tw-opacity-100"
            leaveTo="tw-opacity-0"
          >
            <DialogPanel
              data-testid="memes-art-submission-modal-panel"
              className="tw-flex tw-h-[calc(100dvh-var(--native-keyboard-inset-bottom,0px))] tw-max-h-[calc(100dvh-var(--native-keyboard-inset-bottom,0px))] tw-w-full tw-max-w-screen-xl tw-flex-col tw-transition-[height,max-height] tw-ease-out motion-reduce:tw-transition-none md:tw-h-full md:tw-max-h-none"
              style={{
                transitionDuration: NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION,
              }}
            >
              <DialogTitle className="tw-sr-only">{dialogTitle}</DialogTitle>
              <div className="tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
                <span
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="tw-sr-only"
                >
                  {sourceDrop ? t(locale, metadataMessageKey) : ""}
                </span>
                {sourceDrop && metadataState.status !== "ready" ? (
                  <div className="tw-space-y-4 tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-text-iron-100">
                    <p className="tw-m-0">{t(locale, metadataMessageKey)}</p>
                    {metadataState.status === "error" && (
                      <button
                        type="button"
                        onClick={metadataState.retry}
                        className="tw-min-h-11 tw-rounded-lg tw-bg-iron-800 tw-px-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                      >
                        {t(locale, "memes.submission.resubmit.retry")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="tw-min-h-11 tw-rounded-lg tw-bg-iron-800 tw-px-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                    >
                      {t(locale, "singleDrop.close")}
                    </button>
                  </div>
                ) : (
                  <MemesArtSubmissionContainer
                    onClose={onClose}
                    wave={wave}
                    sourceDrop={hydratedSourceDrop}
                    onSourceDropDeleted={onSourceDropDeleted}
                  />
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>,
    document.body
  );
};

export default MemesArtSubmissionModal;
