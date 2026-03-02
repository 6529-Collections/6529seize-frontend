"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { WaveDropCreate } from "./WaveDropCreate";

interface WaveLeaderboardCurationDropModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

export function WaveLeaderboardCurationDropModal({
  isOpen,
  wave,
  onClose,
}: WaveLeaderboardCurationDropModalProps) {
  const canUseDOM = typeof document !== "undefined";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!canUseDOM || !isOpen) {
    return null;
  }

  return createPortal(
    <dialog
      open
      aria-modal="true"
      aria-labelledby="leaderboard-drop-art-title"
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-m-0 tw-h-full tw-w-full tw-max-w-none tw-border-0 tw-bg-black/70 tw-p-0 tw-outline-none tw-backdrop-blur-sm"
      data-testid="curation-drop-modal"
    >
      <button
        type="button"
        onClick={onClose}
        className="tw-fixed tw-inset-0 tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
        aria-label="Close drop artwork modal"
      />
      <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-items-center tw-justify-center tw-p-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="tw-w-full tw-max-w-2xl tw-rounded-3xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-6 sm:tw-p-8"
          data-testid="curation-drop-modal-panel"
        >
          <div className="tw-mb-6 tw-flex tw-items-start tw-justify-between tw-gap-4">
            <div>
              <h2
                id="leaderboard-drop-art-title"
                className="tw-mb-2 tw-text-4xl tw-font-semibold tw-text-iron-50"
              >
                Drop Artwork
              </h2>
              <p className="tw-mb-0 tw-max-w-lg tw-text-base tw-text-iron-400">
                Enter a supported curation URL to submit a new piece to the
                leaderboard.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-text-iron-500 tw-transition desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-text-iron-200"
              aria-label="Close modal"
            >
              <XMarkIcon className="tw-size-6 tw-flex-shrink-0" />
            </button>
          </div>

          <WaveDropCreate
            wave={wave}
            onSuccess={onClose}
            isCurationLeaderboard
          />
        </motion.div>
      </div>
    </dialog>,
    document.body
  );
}
