"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ApiIdentity } from "../../../generated/models/ApiIdentity";
import CreateDirectMessage from "./CreateDirectMessage";

interface CreateDirectMessageModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly profile: ApiIdentity;
}

export default function CreateDirectMessageModal({
  isOpen,
  onClose,
  onSuccess,
  profile,
}: CreateDirectMessageModalProps) {
  const [mounted, setMounted] = useState(false);
  const handleSuccess = onSuccess ?? onClose;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-start tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-px-4 tw-pb-4 tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] tw-backdrop-blur-[1px] lg:tw-items-center"
            onClick={onClose}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="tw-max-h-[90vh] tw-w-full tw-max-w-3xl tw-rounded-xl tw-bg-iron-950 tw-shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-p-6">
                <h2 className="tw-text-2xl tw-font-bold tw-text-white">
                  New Direct Message
                </h2>
                <button
                  onClick={onClose}
                  className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-ring-1 tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400 lg:tw-size-10"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="tw-max-h-[calc(90vh-80px)]">
                <div className="tw-px-6 tw-pb-8">
                  <CreateDirectMessage
                    profile={profile}
                    onBack={onClose}
                    onSuccess={handleSuccess}
                  />
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>,
    document.body
  );
}
