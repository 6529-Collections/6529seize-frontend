import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiWaveOutcome } from "../../../../generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

interface WaveDetailedManualOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveDetailedManualOutcome: FC<WaveDetailedManualOutcomeProps> = ({
  outcome,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const winnersCount = outcome.distribution?.filter((d) => !!d).length ?? 0;
  const totalCount = outcome.distribution?.length ?? 0;
  const [showAll, setShowAll] = useState(false);

  const getAmounts = (): number[] => {
    if (showAll) {
      return outcome.distribution?.map((d) => d.amount ?? 0) ?? [];
    }
    return (
      outcome.distribution
        ?.slice(0, DEFAULT_AMOUNTS_TO_SHOW)
        .map((d) => d.amount ?? 0) ?? []
    );
  };

  const [amounts, setAmounts] = useState<number[]>(getAmounts());

  useEffect(() => {
    setAmounts(getAmounts());
  }, [showAll]);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-300 desktop-hover:hover:tw-border-iron-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-border-0 tw-px-4 tw-py-3 tw-bg-iron-900/80 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-bg-iron-800/50"
      >
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-lg tw-bg-amber-400/10">
              <svg
                className="tw-size-5 tw-text-[#D4C5AA] tw-flex-shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            <div className="tw-text-left">
              <div className="tw-text-sm tw-font-medium tw-text-iron-50">
                Manual
              </div>
              <div className="tw-text-xs tw-text-iron-400">
                {formatNumberWithCommas(winnersCount)}{" "}
                {winnersCount === 1 ? "Winner" : "Winners"}
              </div>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-flex-shrink-0 tw-size-4 tw-text-iron-400"
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </motion.svg>
          </div>
        </div>
        <div className="tw-mt-2 tw-flex tw-flex-col tw-items-start tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2 tw-border-x-0 tw-border-b-0">
          <div className="tw-text-iron-400 tw-text-xs tw-mb-1">Description</div>
          <div className="tw-text-iron-300 tw-text-sm tw-overflow-x-auto tw-max-w-full tw-whitespace-nowrap tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700">
            {outcome.description}
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
            <div className="tw-divide-y tw-divide-iron-900 tw-divide-solid tw-divide-x-0 tw-overflow-x-auto tw-max-w-full tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700">
              {amounts.map((_, i) => (
                <div
                  key={`wave-detailed-manual-outcome-row-${i}`}
                  className="tw-px-4 tw-py-2 tw-bg-iron-900/30 tw-min-w-max"
                >
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-amber-400/5 tw-text-[#D4C5AA] tw-text-xs tw-font-medium">
                      {i + 1}
                    </span>
                    <span className="tw-whitespace-nowrap tw-text-[#D4C5AA] tw-text-sm tw-font-medium">
                      {outcome.distribution?.[i].amount
                        ? outcome.distribution?.[i].description
                        : ""}
                    </span>
                  </div>
                </div>
              ))}

              {totalCount > DEFAULT_AMOUNTS_TO_SHOW && !showAll && (
                <button
                  className="tw-border-0 tw-w-full tw-px-4 tw-py-2 tw-text-left tw-bg-iron-900/20 tw-text-primary-300/80 tw-text-xs hover:tw-text-primary-300 tw-transition-colors tw-duration-200 hover:tw-bg-iron-900/30"
                  onClick={() => setShowAll(true)}
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
