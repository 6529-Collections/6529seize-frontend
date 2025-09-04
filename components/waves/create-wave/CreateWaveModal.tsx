"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CreateWave from "./CreateWave";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";

interface CreateWaveModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
}

export default function CreateWaveModal({
  isOpen,
  onClose,
  profile,
}: CreateWaveModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-flex tw-items-center tw-justify-center tw-z-[9999] tw-p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="tw-bg-iron-950 tw-rounded-xl tw-w-full tw-max-w-7xl tw-max-h-[90vh] tw-overflow-hidden tw-shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-border-b tw-border-iron-800">
              <h2 className="tw-text-2xl tw-font-bold tw-text-white">
                Create Wave
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
            <div className="tw-overflow-y-auto tw-max-h-[calc(90vh-80px)]">
              <div className="tw-p-6">
                <CreateWave profile={profile} onBack={onClose} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
