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
        onClick={() => setIsOpen(!isOpen)}
        className="tw-flex tw-items-center tw-justify-between tw-w-full tw-border-0 tw-px-4 tw-py-3 tw-bg-iron-900/80 tw-transition-colors tw-duration-300 hover:tw-bg-iron-800/50"
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-lg tw-bg-amber-400/5">
            <svg
              className="tw-size-5 tw-text-amber-300 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 18v-3m0-3v.01M12.75 3.25h-1.5L8.5 7H4.75l.5 3.5L2 13l3.25 2.5-.5 3.5h3.75l2.75 3.75h1.5L15.5 19h3.75l-.5-3.5L22 13l-3.25-2.5.5-3.5H15.5l-2.75-3.75z"
                stroke="currentColor"
                strokeWidth="1.5"
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
          aria-hidden="true"
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
