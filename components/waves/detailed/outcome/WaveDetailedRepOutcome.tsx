import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiWaveOutcome } from "../../../../generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

interface WaveDetailedRepOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveDetailedRepOutcome: FC<WaveDetailedRepOutcomeProps> = ({
  outcome,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const winnersCount = outcome.distribution?.filter((d) => !!d).length ?? 0;
  const totalCount = outcome.distribution?.length ?? 0;
  const [showAll, setShowAll] = useState(false);

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
        className="tw-w-full tw-border-0 tw-px-4 tw-py-3 tw-bg-iron-900/80 tw-transition-colors tw-duration-300 hover:tw-bg-iron-800/50"
      >
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-lg tw-bg-[#C3B5D9]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="tw-size-5 tw-text-[#C3B5D9]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>
            </div>
            <div className="tw-text-left">
              <div className="tw-text-sm tw-font-medium tw-text-[#C3B5D9]">
                Rep
              </div>
              <div className="tw-text-xs tw-text-iron-400">
                {formatNumberWithCommas(winnersCount)}{" "}
                {winnersCount === 1 ? "Winner" : "Winners"}
              </div>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-text-right">
              <div className="tw-text-base tw-font-semibold tw-text-[#C3B5D9]">
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
          <div className="tw-text-iron-400 tw-text-xs tw-mb-1">Category</div>
          <div className="tw-text-iron-300 tw-text-sm tw-break-words tw-line-clamp-3">
            {outcome.rep_category}
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
              {amounts.map((amount, i) => (
                <div
                  key={`wave-detailed-rep-outcome-row-${i}`}
                  className="tw-px-4 tw-py-2 tw-bg-iron-900/30"
                >
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-[#C3B5D9]/5 tw-text-[#C3B5D9] tw-text-xs tw-font-medium">
                      {i + 1}
                    </span>
                    <span className="tw-whitespace-nowrap tw-text-[#C3B5D9] tw-text-sm tw-font-medium">
                      {formatNumberWithCommas(amount)} Rep
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
