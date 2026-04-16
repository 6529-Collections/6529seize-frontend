"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { faCompress } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import type { MouseEventHandler } from "react";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import type { MemesDropMedia } from "./memesDropPanelTypes";

interface MemesDropFullscreenOverlayProps {
  readonly isOpen: boolean;
  readonly artworkMedia?: MemesDropMedia | null | undefined;
  readonly drop: ExtendedDrop;
  readonly title: string;
  readonly description: string;
  readonly onClose: MouseEventHandler<HTMLButtonElement>;
}

export function MemesDropFullscreenOverlay({
  isOpen,
  artworkMedia,
  drop,
  title,
  description,
  onClose,
}: MemesDropFullscreenOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && artworkMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-950/90 tw-p-4"
        >
          <div className="tw-mb-4 tw-flex tw-w-full tw-max-w-5xl tw-items-center tw-justify-between">
            <div className="tw-flex tw-flex-col">
              <div className="tw-flex tw-items-center tw-gap-x-3">
                <SingleWaveDropPosition rank={drop.rank ?? 1} drop={drop} />
                <h3 className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {title}
                </h3>
              </div>
              {description && (
                <p className="tw-ml-10 tw-mt-1 tw-text-md tw-text-iron-400">
                  {description}
                </p>
              )}
            </div>

            <div className="tw-mx-auto">
              <SingleWaveDropVotes drop={drop} />
            </div>

            <button
              onClick={onClose}
              className="tw-rounded-lg tw-bg-iron-900/80 tw-p-3 tw-text-iron-100 tw-transition-colors tw-duration-200 hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
              aria-label="Exit fullscreen view"
            >
              <FontAwesomeIcon icon={faCompress} className="tw-h-5 tw-w-5" />
            </button>
          </div>

          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- Drop media URLs can be arbitrary user-hosted assets. */}
            <img
              src={artworkMedia.url}
              alt={title}
              className="tw-max-h-full tw-max-w-full tw-object-contain"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
