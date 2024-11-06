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
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-border-0 tw-px-4 tw-py-3 tw-bg-iron-900/80 tw-transition-colors tw-duration-300 hover:tw-bg-iron-800/50"
      >
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-lg tw-bg-blue-400/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="tw-size-4 tw-text-blue-300"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="tw-text-left">
              <div className="tw-text-sm tw-font-medium tw-text-blue-300">NIC</div>
              <div className="tw-text-xs tw-text-iron-400">
                {formatNumberWithCommas(winnersCount)} winners
              </div>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-text-right">
              <div className="tw-text-lg tw-font-semibold tw-text-blue-300">
                {formatNumberWithCommas(outcome.amount ?? 0)}
              </div>
              <div className="tw-text-xs tw-text-iron-400">total pool</div>
            </div>
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="tw-flex-shrink-0 tw-size-4 tw-text-iron-400"
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </motion.svg>
          </div>
        </div>
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
