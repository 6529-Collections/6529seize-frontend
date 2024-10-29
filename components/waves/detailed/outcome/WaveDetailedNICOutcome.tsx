import { FC, useEffect, useState } from "react";
import { ApiWaveOutcome } from "../../../../generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { motion, AnimatePresence } from "framer-motion";

interface WaveDetailedNICOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveDetailedNICOutcome: FC<WaveDetailedNICOutcomeProps> = ({
  outcome,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const winnersCount = outcome.distribution?.filter((d) => !!d).length ?? 0;
  const totalCount = outcome.distribution?.length ?? 0;

  const getAmounts = (): number[] => {
    if (showAll) {
      return outcome.distribution?.map((d) => d ?? 0) ?? [];
    }
    return outcome.distribution?.slice(0, DEFAULT_AMOUNTS_TO_SHOW) ?? [];
  };
  const [amounts, setAmounts] = useState<number[]>(getAmounts());

  useEffect(() => {
    setAmounts(getAmounts());
  }, [showAll]);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-300 hover:tw-border-iron-700/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-border-0 tw-w-full tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between tw-bg-iron-900/80 tw-transition-colors tw-duration-300 hover:tw-bg-iron-800/50"
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-lg tw-bg-blue-400/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-size-6 tw-text-blue-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
              />
            </svg>
          </div>
          <div className="tw-flex tw-flex-col">
            <span className="tw-text-iron-50 tw-text-sm tw-font-medium">
              {formatNumberWithCommas(outcome.amount ?? 0)} NIC
            </span>
            <span className="tw-text-xs tw-font-medium tw-text-blue-300">
              {formatNumberWithCommas(winnersCount)}{" "}
              {winnersCount === 1 ? "Winner" : "Winners"}
            </span>
          </div>
        </div>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="tw-flex-shrink-0 tw-size-4 tw-text-iron-400 tw-transition-transform tw-duration-300"
          animate={{ rotate: isOpen ? 0 : -90 }}
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
            <div className="tw-divide-y tw-divide-iron-900 tw-divide-solid tw-divide-x-0">
              {amounts.map((amount, index) => (
                <div
                  key={`wave-detailed-nic-outcome-row-${index}`}
                  className="tw-px-4 tw-py-2 tw-flex tw-items-center tw-justify-between tw-bg-iron-900/30"
                >
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-blue-400/5 tw-text-blue-300 tw-text-xs tw-font-medium">
                      {index + 1}
                    </span>
                    <span className="tw-text-blue-300 tw-text-sm tw-font-medium">
                      {formatNumberWithCommas(amount)} NIC
                    </span>
                  </div>
                </div>
              ))}
              {!showAll && totalCount > DEFAULT_AMOUNTS_TO_SHOW && (
                <button
                  onClick={() => setShowAll(true)}
                  className="tw-border-0 tw-w-full tw-px-4 tw-py-2 tw-text-left tw-bg-iron-900/20 tw-text-primary-300/80 tw-text-xs hover:tw-text-primary-300 tw-transition-colors tw-duration-200 hover:tw-bg-iron-900/30"
                >
                  <span>View more</span>
                  <span className="tw-ml-1 tw-text-iron-400">•</span>
                  <span className="tw-ml-1 tw-text-iron-400">
                    {totalCount - DEFAULT_AMOUNTS_TO_SHOW} more
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
