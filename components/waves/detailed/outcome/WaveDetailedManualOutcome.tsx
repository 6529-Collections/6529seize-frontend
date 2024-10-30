import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiWaveOutcome } from "../../../../generated/models/ApiWaveOutcome";

interface WaveDetailedManualOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

export const WaveDetailedManualOutcome: FC<WaveDetailedManualOutcomeProps> = ({
  outcome,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-300 hover:tw-border-iron-700/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-border-0 tw-w-full tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between tw-bg-iron-900/80 tw-transition-colors tw-duration-300 hover:tw-bg-iron-800/50 tw-group"
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-lg tw-bg-purple-400/5">
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-purple-300"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2V3M3 12H2M5.5 5.5L4.8999 4.8999M18.5 5.5L19.1002 4.8999M22 12H21M10 13.5H14M12 13.5V18.5M15.5 16.874C17.0141 15.7848 18 14.0075 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 14.0075 6.98593 15.7848 8.5 16.874V18.8C8.5 19.9201 8.5 20.4802 8.71799 20.908C8.90973 21.2843 9.21569 21.5903 9.59202 21.782C10.0198 22 10.5799 22 11.7 22H12.3C13.4201 22 13.9802 22 14.408 21.782C14.7843 21.5903 15.0903 21.2843 15.282 20.908C15.5 20.4802 15.5 19.9201 15.5 18.8V16.874Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="tw-text-iron-50 tw-text-sm tw-font-medium">
            Manual
          </span>
        </div>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="tw-size-4 tw-text-iron-400"
          animate={{ rotate: isOpen ? 0 : -95 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-bg-iron-900/30 tw-px-4 tw-py-3">
              <p className="tw-text-iron-200 tw-text-sm tw-mb-0">
                {outcome.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
