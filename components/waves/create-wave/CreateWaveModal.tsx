"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ApiIdentity } from "../../../generated/models/ApiIdentity";
import CreateWave from "./CreateWave";

interface CreateWaveModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
}

const subscribeToClientMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function CreateWaveModal({
  isOpen,
  onClose,
  profile,
}: CreateWaveModalProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-start tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-px-4 tw-pb-4 tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] tw-backdrop-blur-[1px] lg:tw-items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="tw-max-h-[90vh] tw-w-full tw-max-w-5xl tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-p-6">
              <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
                Create Wave
              </h2>
              <button
                onClick={onClose}
                className="tw-hidden tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white sm:tw-inline-flex"
                aria-label="Close modal"
              >
                <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
              </button>
            </div>

            {/* Modal Content */}
            <div
              className="tw-max-h-[calc(90vh-80px)] tw-overflow-y-scroll tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
              style={{ scrollbarGutter: "stable" }}
            >
              <CreateWave
                profile={profile}
                onBack={onClose}
                onSuccess={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
