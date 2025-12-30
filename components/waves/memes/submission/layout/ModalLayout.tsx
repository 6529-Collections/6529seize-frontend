import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import React from "react";

interface ModalLayoutProps {
  readonly title: string;
  readonly onCancel: () => void;
  readonly children: React.ReactNode;
  readonly titleId?: string;
}

/**
 * ModalLayout - Provides a consistent modal layout with ambient background effects
 */
const ModalLayout: React.FC<ModalLayoutProps> = ({
  title,
  onCancel,
  children,
  titleId,
}) => {
  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
      <motion.div className="tw-w-full tw-z-50">
        <div className="tw-w-full tw-bg-iron-950 tw-rounded-t-xl md:tw-rounded-xl tw-relative tw-border tw-border-solid tw-border-white/10 tw-border-b-0 md:tw-border-b tw-overflow-hidden">
          {/* Ambient background effect */}
          <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-overflow-hidden">
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/[0.03] tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
            <div className="tw-absolute tw-w-2/3 tw-h-1/2 tw-bg-purple-500/[0.02] tw-blur-3xl tw-top-1/4 -tw-left-1/4" />
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/[0.03] tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
          </div>

          {/* Header Section with bottom border */}
          <div className="tw-relative tw-z-10 tw-px-6 tw-py-4 tw-border-b tw-border-solid tw-border-white/5 tw-border-t-0 tw-border-x-0 tw-flex tw-justify-between tw-items-center">
            <motion.h3
              id={titleId}
              className="tw-text-lg tw-font-bold tw-text-white tw-mb-0"
            >
              {title}
            </motion.h3>
            <motion.button
              onClick={onCancel}
              className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-text-white/40 desktop-hover:hover:tw-text-white tw-transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="tw-size-6 tw-flex-shrink-0" />
            </motion.button>
          </div>

          {/* Main Content */}
          <div className="tw-relative tw-z-10 tw-px-6 tw-py-6">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalLayout;
