"use client";

import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { CSSProperties, ReactNode } from "react";
import { Fragment, useRef } from "react";

const KEYBOARD_INSET = "var(--native-keyboard-inset-bottom, 0px)";
const KEYBOARD_TRANSITION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";
const APP_DIALOG_LAYOUT_STYLE: CSSProperties = {
  height: `max(0px, calc(100% - ${KEYBOARD_INSET}))`,
  transform: `translate3d(0, calc(0px - ${KEYBOARD_INSET}), 0)`,
  transition: `height ${KEYBOARD_TRANSITION} ease-out, transform ${KEYBOARD_TRANSITION} ease-out`,
};
const APP_DIALOG_PANEL_STYLE: CSSProperties = {
  maxHeight: `min(85vh, max(0px, calc(100vh - ${KEYBOARD_INSET})))`,
};

export default function ArtistPreviewAppWrapper({
  isOpen,
  onClose,
  children,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const constraintsRef = useRef(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(contentRef);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1010] tw-overflow-hidden"
        onClose={onClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-300 tw-ease-in-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-300 tw-ease-in-out"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-black/70 tw-backdrop-blur-[1px] tw-transition-opacity" />
        </TransitionChild>

        <div
          data-testid="artist-preview-app-layout"
          className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-items-end"
          style={APP_DIALOG_LAYOUT_STYLE}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          ref={constraintsRef}
        >
          <TransitionChild
            as={Fragment}
            enter="tw-transform tw-duration-300 tw-ease-out"
            enterFrom="tw-translate-y-full"
            enterTo="tw-translate-y-0"
            leave="tw-transform tw-duration-300 tw-ease-in"
            leaveFrom="tw-translate-y-0"
            leaveTo="tw-translate-y-full"
          >
            <div className="tw-pointer-events-auto tw-relative tw-w-full tw-transform-gpu tw-will-change-transform">
              <TransitionChild
                as={Fragment}
                enter="tw-duration-300 tw-ease-in-out motion-reduce:tw-transition-none"
                enterFrom="tw-opacity-0"
                enterTo="tw-opacity-100"
                leave="tw-duration-300 tw-ease-in-out motion-reduce:tw-transition-none"
                leaveFrom="tw-opacity-100"
                leaveTo="tw-opacity-0"
              >
                <div className="tw-absolute -tw-top-16 tw-right-0 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
                  <button
                    type="button"
                    aria-label="Close panel"
                    className="tw-relative tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/90 tw-p-0 tw-text-iron-300 tw-backdrop-blur-sm tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-scale-95 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-text-white motion-reduce:tw-transform-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
                  </button>
                </div>
              </TransitionChild>

              <DialogPanel
                style={APP_DIALOG_PANEL_STYLE}
                className="tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-t-2xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-[#0B0C0E] tw-pb-[env(safe-area-inset-bottom,0px)] tw-shadow-[0_-18px_50px_rgba(0,0,0,0.45)]"
              >
                <div
                  ref={contentRef}
                  data-testid="artist-preview-app-scroll"
                  className="tw-min-h-0 tw-flex-1 tw-scroll-py-3 tw-overflow-y-auto tw-overscroll-contain tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600"
                >
                  {children}
                </div>
              </DialogPanel>
            </div>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
