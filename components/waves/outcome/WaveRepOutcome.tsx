"use client";

import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-regular-svg-icons";

interface WaveRepOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveRepOutcome: FC<WaveRepOutcomeProps> = ({ outcome }) => {
  const [isOpen, setIsOpen] = useState(false);
  const winnersCount =
    outcome.distribution?.filter((d) => !!d.amount).length ?? 0;
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
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-300 desktop-hover:hover:tw-border-iron-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-border-0 tw-px-4 tw-py-3 tw-bg-iron-950">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-xl tw-bg-gradient-to-br tw-from-[#C3B5D9]/20 tw-to-[#C3B5D9]/10 tw-shadow-inner">
              <FontAwesomeIcon
                icon={faStar}
                className="tw-size-5 tw-text-[#C3B5D9] tw-flex-shrink-0 tw-drop-shadow-[0_0_3px_rgba(195,181,217,0.5)]"
              />
            </div>
            <div className="tw-text-left">
              <div className="tw-text-base tw-font-medium tw-text-[#C3B5D9]">
                Rep
              </div>
              <div className="tw-text-sm tw-text-[#C3B5D9]/80">
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
          </div>
        </div>
        <div className="tw-mt-3 tw-flex tw-flex-col tw-items-start tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-3 tw-border-x-0 tw-border-b-0">
          <div className="tw-flex tw-w-full tw-justify-between tw-items-center">
            <div className="tw-text-iron-300 tw-text-sm tw-font-medium tw-mb-1">
              Category
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
              transition={{ duration: 0.2 }}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </motion.svg>
          </div>
          <div className="tw-text-iron-400 tw-text-sm tw-overflow-x-auto tw-max-w-full tw-whitespace-nowrap tw-scrollbar-thin tw-scrollbar-track-iron-900/50 tw-scrollbar-thumb-iron-600/50">
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
            className="tw-overflow-hidden tw-bg-gradient-to-b tw-from-iron-900/50 tw-to-iron-950/50">
            <div className="tw-divide-y tw-divide-iron-800/30 tw-divide-solid tw-divide-x-0">
              {amounts.map((amount, i) => (
                <div
                  key={`wave-rep-outcome-${amount}-${i}`}
                  className="tw-px-4 tw-py-3 tw-bg-gradient-to-r hover:tw-from-[#C3B5D9]/5 hover:tw-to-transparent tw-transition-colors tw-duration-300">
                  <div className="tw-flex tw-items-center tw-gap-4">
                    <span className="tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-lg tw-bg-gradient-to-br tw-from-[#C3B5D9]/10 tw-to-[#C3B5D9]/5 tw-text-[#C3B5D9] tw-text-sm tw-font-semibold">
                      {i + 1}
                    </span>
                    <span className="tw-whitespace-nowrap tw-text-[#C3B5D9] tw-text-base tw-font-medium">
                      {formatNumberWithCommas(amount)} Rep
                    </span>
                  </div>
                </div>
              ))}

              {totalCount > DEFAULT_AMOUNTS_TO_SHOW && !showAll && (
                <button
                  className="tw-border-0 tw-w-full tw-px-4 tw-py-3 tw-text-left tw-bg-iron-900 tw-text-[#C3B5D9]/80 tw-text-sm hover:tw-text-[#C3B5D9] tw-transition-all tw-duration-300"
                  onClick={() => setShowAll(true)}>
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
