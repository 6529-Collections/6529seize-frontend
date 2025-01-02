import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../../../generated/models/ApiWave";
import { useDropOutcomes } from "../../../../../../hooks/drops/useDropOutcomes";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

interface WaveWinnersDropOutcomeProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
}

export default function WaveWinnersDropOutcome({
  drop,
  wave,
}: WaveWinnersDropOutcomeProps) {
  const {
    outcomes: { nicOutcomes, repOutcomes, manualOutcomes },
    haveOutcomes,
  } = useDropOutcomes({
    drop,
    wave,
  });

  if (!haveOutcomes) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap sm:tw-flex-nowrap tw-items-start tw-gap-2">
      <div className="tw-text-sm tw-font-medium tw-text-white/60 tw-mt-1.5">
        Outcome:
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {nicOutcomes.map((nicOutcome, i) => (
          <div
            key={`NIC-${i}`}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-xl tw-bg-iron-800 tw-backdrop-blur-sm tw-border tw-border-iron-700"
          >
            <svg
              className="tw-size-4 tw-text-[#A4C2DB] tw-flex-shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M9 6.75H15M9 12H15M9 17.25H12M3.75 19.5H20.25C21.0784 19.5 21.75 18.8284 21.75 18V6C21.75 5.17157 21.0784 4.5 20.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V18C2.25 18.8284 2.92157 19.5 3.75 19.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
              NIC
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-[#A4C2DB]">
              {formatNumberWithCommas(nicOutcome.value)}
            </span>
          </div>
        ))}
        {repOutcomes.map((repOutcome, i) => (
          <div
            key={`REP-${repOutcome.category}-${i}`}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-xl tw-bg-iron-800 tw-backdrop-blur-sm tw-border tw-border-iron-700"
          >
            <svg
              className="tw-size-4 tw-text-[#C3B5D9] tw-flex-shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
              Rep
            </span>
            <div className="tw-flex tw-items-center tw-gap-x-1.5">
              <span className="tw-text-sm tw-font-semibold tw-text-[#C3B5D9]">
                {formatNumberWithCommas(repOutcome.value)}
              </span>
              <span className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-400"></span>
              <span className="tw-text-sm tw-font-semibold tw-text-[#C3B5D9]">
                {repOutcome.category}
              </span>
            </div>
          </div>
        ))}
        {manualOutcomes.map((outcome, i) => (
          <div
            key={`MANUAL-${outcome.description}-${i}`}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-xl tw-bg-iron-800 tw-backdrop-blur-sm tw-border tw-border-iron-700"
          >
            <svg
              className="tw-size-4 tw-text-amber-300/80 tw-flex-shrink-0"
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
            <span className="tw-text-sm tw-font-medium tw-text-amber-100">
              {outcome.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
