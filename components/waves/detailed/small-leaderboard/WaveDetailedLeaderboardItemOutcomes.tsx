import React, { useState } from "react";
import Tippy from "@tippyjs/react";

import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveOutcomeCredit } from "../../../../generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "../../../../generated/models/ApiWaveOutcomeType";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

interface WaveDetailedLeaderboardItemOutcomesProps {
  readonly drop: ApiDrop;
  readonly wave: ApiWave;
  readonly isMobile?: boolean;
}

interface OutcomeSummary {
  nicTotal: number;
  repTotal: number;
  manualOutcomes: string[];
}

const calculateNIC = ({
  drop,
  wave,
}: {
  drop: ApiDrop;
  wave: ApiWave;
}): number => {
  const rank = drop.rank;
  if (!rank) return 0;
  const outcomes = wave.outcomes;
  const nicOutcomes = outcomes.filter(
    (outcome) => outcome.credit === ApiWaveOutcomeCredit.Cic
  );
  const nic = nicOutcomes.reduce((acc, outcome) => {
    return acc + (outcome.distribution?.[rank - 1]?.amount ?? 0);
  }, 0);
  return nic;
};

const calculateRep = ({
  drop,
  wave,
}: {
  drop: ApiDrop;
  wave: ApiWave;
}): number => {
  const rank = drop.rank;
  if (!rank) return 0;
  const outcomes = wave.outcomes;
  const repOutcomes = outcomes.filter(
    (outcome) => outcome.credit === ApiWaveOutcomeCredit.Rep
  );
  const rep = repOutcomes.reduce((acc, outcome) => {
    return acc + (outcome.distribution?.[rank - 1]?.amount ?? 0);
  }, 0);
  return rep;
};

const calculateManualOutcomes = ({
  drop,
  wave,
}: {
  drop: ApiDrop;
  wave: ApiWave;
}): string[] => {
  const rank = drop.rank;
  if (!rank) return [];
  const outcomes = wave.outcomes;
  const manualOutcomes = outcomes.filter(
    (outcome) => outcome.type === ApiWaveOutcomeType.Manual
  );
  return manualOutcomes
    .filter((outcome) => !!outcome.distribution?.[rank - 1]?.amount)
    .map((outcome) => outcome.distribution?.[rank - 1]?.description ?? "");
};

const calculateOutcomeSummary = ({
  drop,
  wave,
}: {
  drop: ApiDrop;
  wave: ApiWave;
}): OutcomeSummary => {
  return {
    nicTotal: calculateNIC({ drop, wave }),
    repTotal: calculateRep({ drop, wave }),
    manualOutcomes: calculateManualOutcomes({ drop, wave }),
  };
};

export const WaveDetailedLeaderboardItemOutcomes: React.FC<
  WaveDetailedLeaderboardItemOutcomesProps
> = ({ drop, wave, isMobile = false }) => {
  const { nicTotal, repTotal, manualOutcomes } = calculateOutcomeSummary({
    drop,
    wave,
  });
  const totalOutcomes =
    (!!nicTotal ? 1 : 0) + (!!repTotal ? 1 : 0) + manualOutcomes.length;

  if (totalOutcomes === 0) {
    return null;
  }

  const tooltipContent = (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-p-2">
      {!!nicTotal && (
        <div className="tw-flex tw-items-center tw-gap-2">
          <svg
            className="tw-size-4 tw-text-[#A4C2DB]"
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
          <span>{nicTotal} NIC</span>
        </div>
      )}
      {!!repTotal && (
        <div className="tw-flex tw-items-center tw-gap-2">
          <svg
            className="tw-size-4 tw-text-[#C3B5D9]"
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
          <span>{repTotal} Rep</span>
        </div>
      )}
      {manualOutcomes.map((outcome, index) => (
        <div key={index} className="tw-flex tw-items-center tw-gap-2">
          <svg
            className="tw-size-4 tw-text-[#D4C5AA]"
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
          <span>{outcome}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Tippy content={tooltipContent} placement="top" animation="shift-away">
      <button
        className={`tw-border-0 tw-rounded-lg tw-flex tw-items-center ${
          isMobile ? "tw-gap-4" : "tw-gap-2"
        } tw-px-4 tw-py-1.5 md:tw-py-1 tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50`}
      >
        <span className="tw-text-iron-300 tw-text-sm tw-font-medium">Outcome:</span>
        <div
          className={`tw-flex tw-items-center ${
            isMobile ? "tw-gap-2" : "tw-gap-1"
          }`}
        >
          {!!nicTotal && (
            <svg
              className="tw-size-4 tw-text-[#A4C2DB]"
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
          )}
          {!!repTotal && (
            <svg
              className="tw-size-4 tw-text-[#C3B5D9]"
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
          )}
          {manualOutcomes.length > 0 && (
            <svg
              className="tw-size-4 tw-text-[#D4C5AA]"
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
          )}
        </div>
      </button>
    </Tippy>
  );
};
