import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface ModalLayoutProps {
  readonly title: string;
  readonly onCancel: () => void;
  readonly children: React.ReactNode;
}

/**
 * ModalLayout - Provides a consistent modal layout with ambient background effects
 */
const ModalLayout: React.FC<ModalLayoutProps> = ({
  title,
  onCancel,
  children,
}) => {
  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
      <motion.div className="tw-w-full tw-z-50">
        <div className="tw-w-full tw-bg-iron-950 tw-rounded-t-xl md:tw-rounded-xl tw-px-2 sm:tw-px-4 tw-pt-8 md:tw-px-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur tw-border-b-0 md:tw-border-b">
          {/* Ambient background effect */}
          <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-overflow-hidden">
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/[0.03] tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
            <div className="tw-absolute tw-w-2/3 tw-h-1/2 tw-bg-purple-500/[0.02] tw-blur-3xl tw-top-1/4 -tw-left-1/4" />
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/[0.03] tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
          </div>

          {/* X close button */}
          <motion.button
            onClick={onCancel}
            className="tw-absolute tw-right-2 tw-top-2 lg:tw-right-8 lg:tw-top-8 tw-z-20 tw-flex tw-items-center tw-justify-center tw-size-8 lg:tw-size-10 tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-100 tw-transition-all"
            aria-label="Close modal"
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="tw-size-5 lg:tw-size-6 tw-flex-shrink-0"
            />
          </motion.button>

          <div className="tw-relative tw-z-10">
            {/* Header Section with bottom border */}
            <div className="tw-mb-6">
              <motion.h3
                className="tw-text-2xl sm:tw-text-3xl tw-font-semibold tw-text-iron-100"
              >
                {title}
              </motion.h3>
            </div>

            {/* Main Content */}
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalLayout;
