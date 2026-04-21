"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MemesArtSubmissionShellProps {
  readonly title: string;
  readonly description?: string | undefined;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function MemesArtSubmissionShell({
  title,
  description,
  onClose,
  children,
}: MemesArtSubmissionShellProps) {
  return (
    <div className="tw-flex tw-h-full tw-flex-col">
      <div className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-backdrop-blur">
        <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-flex-col">
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-pb-6 md:tw-px-8">
            <div className="tw-flex tw-w-full tw-flex-shrink-0 tw-items-center tw-justify-between tw-pt-6 lg:tw-border-b-0">
              <motion.h3 className="tw-mb-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 md:tw-text-2xl">
                {title}
              </motion.h3>
              <motion.button
                type="button"
                onClick={onClose}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-ring-1 tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400 lg:tw-size-10"
                aria-label="Close modal"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  className="tw-size-5 tw-flex-shrink-0"
                />
              </motion.button>
            </div>
            {description && (
              <p className="tw-mb-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
                {description}
              </p>
            )}
          </div>
          <div className="tw-min-h-0 tw-flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
