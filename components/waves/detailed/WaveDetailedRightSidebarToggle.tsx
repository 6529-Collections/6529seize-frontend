import { motion } from "framer-motion";
import React from "react";

interface WaveDetailedRightSidebarToggleProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

const WaveDetailedRightSidebarToggle: React.FC<
  WaveDetailedRightSidebarToggleProps
> = ({ isOpen, onToggle }) => {
  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      onClick={onToggle}
      className="tw-border-0 tw-absolute tw-left-2 lg:-tw-left-7 tw-z-50 tw-top-[7.5rem] tw-text-iron-300 hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-700 tw-rounded-r-lg lg:tw-rounded-r-none tw-rounded-l-lg tw-size-7 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20"
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        aria-hidden="true"
        stroke="currentColor"
        className="tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-ease-in-out"
        animate={{ rotate: isOpen ? 0 : 180 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
        />
      </motion.svg>
    </button>
  );
};

export default WaveDetailedRightSidebarToggle;
