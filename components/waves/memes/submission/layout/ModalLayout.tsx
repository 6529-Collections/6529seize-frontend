import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import React from "react";

interface ModalLayoutProps {
  readonly title: string;
  readonly onCancel: () => void;
  readonly children: React.ReactNode;
  readonly titleId?: string | undefined;
  readonly contentClassName?: string | undefined;
  readonly surfaceClassName?: string | undefined;
  readonly headerClassName?: string | undefined;
  readonly titleClassName?: string | undefined;
  readonly closeButtonClassName?: string | undefined;
  readonly closeIconClassName?: string | undefined;
  readonly headerActions?: React.ReactNode;
  readonly showAmbientBackground?: boolean | undefined;
  readonly wrapperClassName?: string | undefined;
}

/**
 * ModalLayout - Provides a consistent modal layout with ambient background effects
 */
const ModalLayout: React.FC<ModalLayoutProps> = ({
  title,
  onCancel,
  children,
  titleId,
  contentClassName = "tw-relative tw-z-10 tw-px-6 tw-py-6",
  surfaceClassName = "tw-w-full tw-bg-iron-950 tw-rounded-t-xl md:tw-rounded-xl tw-relative tw-border tw-border-solid tw-border-white/10 tw-border-b-0 md:tw-border-b tw-overflow-hidden",
  headerClassName = "tw-relative tw-z-10 tw-px-6 tw-py-4 tw-border-b tw-border-solid tw-border-white/5 tw-border-t-0 tw-border-x-0 tw-flex tw-justify-between tw-items-center",
  titleClassName = "tw-text-lg tw-font-bold tw-text-white tw-mb-0",
  closeButtonClassName = "tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-text-white/40 desktop-hover:hover:tw-text-white tw-transition-colors",
  closeIconClassName = "tw-size-6 tw-flex-shrink-0",
  headerActions,
  showAmbientBackground = true,
  wrapperClassName = "tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0",
}) => {
  return (
    <div className={wrapperClassName}>
      <motion.div className="tw-z-50 tw-w-full">
        <div className={surfaceClassName}>
          {/* Ambient background effect */}
          {showAmbientBackground && (
            <div className="tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-xl">
              <div className="tw-absolute -tw-right-1/4 -tw-top-1/4 tw-h-1/2 tw-w-1/2 tw-bg-primary-500/[0.03] tw-blur-3xl" />
              <div className="tw-absolute -tw-left-1/4 tw-top-1/4 tw-h-1/2 tw-w-2/3 tw-bg-purple-500/[0.02] tw-blur-3xl" />
              <div className="tw-absolute -tw-bottom-1/4 -tw-left-1/4 tw-h-1/2 tw-w-1/2 tw-bg-iron-500/[0.03] tw-blur-3xl" />
            </div>
          )}

          {/* Header Section with bottom border */}
          <div className={headerClassName}>
            <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2">
              <motion.h3 id={titleId} className={titleClassName}>
                {title}
              </motion.h3>
              {headerActions !== undefined && headerActions !== null && (
                <div className="tw-flex tw-items-center">{headerActions}</div>
              )}
            </div>
            <motion.button
              onClick={onCancel}
              className={closeButtonClassName}
              aria-label="Close modal"
            >
              <XMarkIcon className={closeIconClassName} />
            </motion.button>
          </div>

          {/* Main Content */}
          <div className={contentClassName}>{children}</div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalLayout;
