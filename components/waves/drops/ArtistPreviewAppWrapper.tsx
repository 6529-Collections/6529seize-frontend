"use client"

import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { Fragment, ReactNode, useRef } from "react";

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
  const dragControls = useDragControls();

  const handleDragEnd = (_: any, info: PanInfo) => {
    // More lenient threshold for closing
    if (info.offset.y > 80 || info.velocity.y > 300) {
      onClose();
    }
  };
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tw-fixed tw-inset-0 tw-z-[1010] tw-overflow-hidden tailwind-scope"
        onClose={onClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-ease-in-out tw-duration-300"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in-out tw-duration-300"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-transition-opacity" />
        </TransitionChild>

        { }
        <div
          className="tw-fixed tw-inset-0 tw-flex tw-items-end"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          ref={constraintsRef}
        >
          <TransitionChild
            as={Fragment}
            enter="tw-transform tw-ease-out tw-duration-300"
            enterFrom="tw-translate-y-full"
            enterTo="tw-translate-y-0"
            leave="tw-transform tw-ease-in tw-duration-300"
            leaveFrom="tw-translate-y-0"
            leaveTo="tw-translate-y-full"
          >
            <motion.div
              drag="y"
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              dragControls={dragControls}
              dragListener={false}
              className="tw-pointer-events-auto tw-w-full"
            >
              <DialogPanel className="tw-w-full tw-bg-iron-950 tw-shadow-xl tw-flex tw-flex-col tw-rounded-t-2xl tw-pb-[env(safe-area-inset-bottom,0px)] tw-max-h-[85vh] tw-relative">
                <TransitionChild
                  as={Fragment}
                  enter="tw-ease-in-out tw-duration-300"
                  enterFrom="tw-opacity-0"
                  enterTo="tw-opacity-100"
                  leave="tw-ease-in-out tw-duration-300"
                  leaveFrom="tw-opacity-100"
                  leaveTo="tw-opacity-0"
                >
                  <div className="tw-absolute tw-right-0 -tw-top-16 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
                    <button
                      type="button"
                      aria-label="Close panel"
                      className="tw-p-2.5 tw-relative tw-bg-transparent tw-rounded-md focus:tw-outline-none tw-border-none focus:tw-ring-2 focus:tw-ring-white"
                      onClick={onClose}
                    >
                      <XMarkIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0 tw-text-white" />
                    </button>
                  </div>
                </TransitionChild>
                
                <div className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800">
                  {children}
                </div>
              </DialogPanel>
            </motion.div>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
