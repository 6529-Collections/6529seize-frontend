import { AnimatePresence, motion } from "framer-motion";
import React, { useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

interface AllowlistToolModelWrapperProps {
  children: React.ReactNode;
  showModal: boolean;
  onClose: () => void;
  title: string;
}

export default function AllowlistToolModelWrapper({
  children,
  showModal,
  onClose,
  title,
}: AllowlistToolModelWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => onClose());
  useKeyPressEvent("Escape", () => onClose());
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          key="modal"
          className="tw-relative tw-z-10"
          role="dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="tw-relative tw-z-10" role="dialog">
            <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
            <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
              <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
                <div
                  ref={modalRef}
                  className="tw-relative tw-w-full tw-transform  tw-rounded-xl tw-bg-neutral-900 tw-px-4 tw-pb-4 tw-pt-5 tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full sm:tw-max-w-lg sm:tw-p-6"
                >
                  <div className="tw-flex tw-justify-between tw-items-center">
                    <p className="tw-text-lg tw-text-white tw-font-medium tw-mb-0">
                      {title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      type="button"
                      className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-neutral-600 tw-transition tw-duration-300 tw-ease-out"
                    >
                      <span className="sr-only tw-text-sm">Close</span>
                      <svg
                        className="tw-h-6 tw-w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
