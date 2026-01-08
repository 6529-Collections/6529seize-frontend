"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ApiIdentity } from "../../../generated/models/ApiIdentity";
import CreateDirectMessage from "./CreateDirectMessage";

interface CreateDirectMessageModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
}

export default function CreateDirectMessageModal({
  isOpen,
  onClose,
  profile,
}: CreateDirectMessageModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-flex tw-items-start lg:tw-items-center tw-justify-center tw-z-[9999] tw-px-4 tw-pb-4 tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="tw-bg-iron-950 tw-rounded-xl tw-w-full tw-max-w-3xl tw-max-h-[90vh] tw-shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-border-b tw-border-iron-800">
              <h2 className="tw-text-2xl tw-font-bold tw-text-white">
                New Direct Message
              </h2>
              <button
                onClick={onClose}
                className="tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-size-9 lg:tw-size-10 tw-rounded-full tw-border-0 tw-ring-1 tw-ring-iron-700 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
                aria-label="Close modal"
              >
                <XMarkIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="tw-max-h-[calc(90vh-80px)]">
              <div className="tw-px-6 tw-pb-8">
                <CreateDirectMessage profile={profile} onBack={onClose} onSuccess={onClose} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
