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
  readonly parentWaveId?: string | null | undefined;
}

const subscribeToClientMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function CreateWaveModal({
  isOpen,
  onClose,
  profile,
  parentWaveId,
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
            // svh, not vh: iOS reports vh as the large (chrome-collapsed)
            // viewport, but the app shell disables document scroll so Safari's
            // chrome never collapses. Sizing to vh made the modal taller than
            // the visible area, hiding the footer (Next) behind the chrome.
            // flex-col keeps the header fixed and lets the body scroll within
            // the guaranteed-visible height.
            className="tw-flex tw-max-h-[calc(100svh-env(safe-area-inset-top)-2rem)] tw-w-full tw-max-w-5xl tw-flex-col tw-overflow-hidden tw-rounded-3xl tw-border tw-border-solid tw-border-white/10 tw-bg-[#09090B] tw-shadow-[0_0_80px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-white/[0.06] tw-bg-transparent tw-px-8 tw-py-5">
              <h2 className="tw-mb-0 tw-text-[17px] tw-font-bold tw-tracking-wide tw-text-white">
                {parentWaveId ? "Create subwave" : "Create Wave"}
              </h2>
              <button
                onClick={onClose}
                className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-text-iron-400 tw-transition tw-duration-200 hover:tw-bg-white/10 hover:tw-text-white"
                aria-label="Close modal"
              >
                <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
              </button>
            </div>

            {/* Modal Content */}
            <div
              className="tw-min-h-0 tw-flex-1 tw-overflow-y-scroll tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15"
              style={{ scrollbarGutter: "stable" }}
            >
              <CreateWave
                profile={profile}
                onBack={onClose}
                onSuccess={onClose}
                parentWaveId={parentWaveId}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
