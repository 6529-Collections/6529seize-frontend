import React from "react";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import { ApiWaveOutcomeCredit } from "../../../../../generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "../../../../../generated/models/ApiWaveOutcomeType";
import { OutcomeType } from "../../../../../hooks/drops/useDropOutcomes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import { faAward } from "@fortawesome/free-solid-svg-icons";

interface WaveWinnersDropOutcomeProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropOutcome({ winner }: WaveWinnersDropOutcomeProps) {
  // Transform awards into outcome format
  const nicOutcomes = winner.awards
    .filter(
      (award) =>
        award.credit === ApiWaveOutcomeCredit.Cic &&
        award.amount &&
        award.amount > 0
    )
    .map((award) => ({
      type: OutcomeType.NIC as const,
      value: award.amount || 0,
    }));

  const repOutcomes = winner.awards
    .filter(
      (award) =>
        award.credit === ApiWaveOutcomeCredit.Rep &&
        award.amount &&
        award.amount > 0
    )
    .map((award) => ({
      type: OutcomeType.REP as const,
      value: award.amount || 0,
      category: award.rep_category || "",
    }));

  const manualOutcomes = winner.awards
    .filter(
      (award) => award.type === ApiWaveOutcomeType.Manual && award.description
    )
    .map((award) => ({
      type: OutcomeType.MANUAL as const,
      description: award.description || "",
    }));

  const haveOutcomes =
    nicOutcomes.length > 0 ||
    repOutcomes.length > 0 ||
    manualOutcomes.length > 0;

  if (!haveOutcomes) {
    return null;
  }

  return (
    <div className="tw-flex tw-items-start tw-gap-2">
      <div className="tw-text-sm tw-font-medium tw-text-white/50 tw-mt-1">
        Outcome:
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-1.5">
        {nicOutcomes.map((nicOutcome) => (
          <div 
            key={`NIC-${nicOutcome.value}`} 
            className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-rounded-lg tw-bg-iron-800/40 tw-border-[0.5px] tw-border-iron-700/30"
          >
            <FontAwesomeIcon icon={faAddressCard} className="tw-size-3.5 tw-text-blue-300/70" />
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">NIC</span>
            <span className="tw-text-sm tw-font-medium tw-text-blue-200/90">
              {formatNumberWithCommas(nicOutcome.value)}
            </span>
          </div>
        ))}
        
        {repOutcomes.map((repOutcome) => (
          <div 
            key={`REP-${repOutcome.category}-${repOutcome.value}`}
            className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-rounded-lg tw-bg-iron-800/40 tw-border-[0.5px] tw-border-iron-700/30"
          >
            <FontAwesomeIcon icon={faStar} className="tw-size-3.5 tw-text-purple-300/70" />
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">Rep</span>
            <span className="tw-text-sm tw-font-medium tw-text-purple-200/90">
              {formatNumberWithCommas(repOutcome.value)}
            </span>
            {repOutcome.category && (
              <>
                <span className="tw-size-[2px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-400/70"></span>
                <span className="tw-text-sm tw-font-medium tw-text-purple-200/90">{repOutcome.category}</span>
              </>
            )}
          </div>
        ))}
        
        {manualOutcomes.map((outcome) => (
          <div
            key={`MANUAL-${outcome.description}`}
            className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-rounded-lg tw-bg-iron-800/40 tw-border-[0.5px] tw-border-iron-700/30"
          >
            <FontAwesomeIcon icon={faAward} className="tw-size-3.5 tw-text-amber-300/70" />
            <span className="tw-text-sm tw-font-medium tw-text-amber-100/90">{outcome.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
