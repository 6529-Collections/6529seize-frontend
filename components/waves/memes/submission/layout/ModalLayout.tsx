import React from "react";
import { motion } from "framer-motion";

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
  children
}) => {
  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-h-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="tw-w-full tw-bg-iron-950 tw-rounded-xl tw-p-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur">
          {/* Ambient background effect */}
          <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-overflow-hidden">
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/4 tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
            <div className="tw-absolute tw-w-2/3 tw-h-1/2 tw-bg-purple-500/3 tw-blur-3xl tw-top-1/4 -tw-left-1/4" />
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/4 tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
          </div>

          {/* Cancel button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={onCancel}
            className="tw-absolute tw-bg-transparent tw-border-0 tw-right-8 tw-top-10 tw-z-20 tw-text-iron-400 tw-text-sm tw-font-medium hover:tw-text-iron-100 tw-transition-colors"
          >
            Cancel
          </motion.button>

          <div className="tw-relative tw-z-10">
            {/* Modern Header */}
            <motion.h3
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tw-text-3xl tw-font-semibold tw-text-iron-100"
            >
              {title}
            </motion.h3>

            {/* Main Content */}
            {children}
          </div>
        </div>
      </motion.div>
      <div className="tw-inline-block"></div>
    </div>
  );
};

export default ModalLayout;