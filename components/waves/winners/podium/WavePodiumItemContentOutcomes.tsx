"use client";

import React, { useMemo } from "react";
import { Tooltip } from "react-tooltip";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

interface WavePodiumItemContentOutcomesProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly outcomesVisible?: boolean | undefined;
}

export const WavePodiumItemContentOutcomes: React.FC<
  WavePodiumItemContentOutcomesProps
> = ({ winner, outcomesVisible = true }) => {
  // Transform awards into the same format that useDropOutcomes provided
  const { nicOutcomes, repOutcomes, manualOutcomes, haveOutcomes } =
    useMemo(() => {
      if (!outcomesVisible) {
        return {
          nicOutcomes: [],
          repOutcomes: [],
          manualOutcomes: [],
          haveOutcomes: false,
        };
      }

      const memoizedNicOutcomes = winner.awards
        .filter((award) => {
          const amount = award.amount ?? 0;
          return award.credit === ApiWaveOutcomeCredit.Cic && amount > 0;
        })
        .map((award) => ({
          type: ApiWaveOutcomeCredit.Cic,
          value: award.amount ?? 0,
        }));

      const memoizedRepOutcomes = winner.awards
        .filter((award) => {
          const amount = award.amount ?? 0;
          return award.credit === ApiWaveOutcomeCredit.Rep && amount > 0;
        })
        .map((award) => ({
          type: ApiWaveOutcomeCredit.Rep,
          value: award.amount ?? 0,
          category: award.rep_category ?? "",
        }));

      const memoizedManualOutcomes = winner.awards
        .filter((award) => {
          const description = award.description;
          return (
            award.type === ApiWaveOutcomeType.Manual &&
            typeof description === "string" &&
            description.length > 0
          );
        })
        .map((award) => ({
          type: ApiWaveOutcomeType.Manual,
          description: award.description ?? "",
        }));

      const memoizedHaveOutcomes =
        memoizedNicOutcomes.length > 0 ||
        memoizedRepOutcomes.length > 0 ||
        memoizedManualOutcomes.length > 0;

      return {
        nicOutcomes: memoizedNicOutcomes,
        repOutcomes: memoizedRepOutcomes,
        manualOutcomes: memoizedManualOutcomes,
        haveOutcomes: memoizedHaveOutcomes,
      };
    }, [outcomesVisible, winner.awards]);

  if (!outcomesVisible) {
    return null;
  }

  if (!haveOutcomes) {
    return null;
  }

  const tooltipId = `outcome-${winner.place}-${winner.drop.id}`;

  const tooltipContent = (
    <div className="tw-flex tw-min-w-[180px] tw-flex-col tw-gap-y-1.5 tw-py-0.5">
      {nicOutcomes.map((nicOutcome) => (
        <div
          key={`NIC-${nicOutcome.value}`}
          className="tw-flex tw-items-center tw-gap-x-1.5"
        >
          <span className="tw-font-medium tw-text-iron-50">NIC</span>
          <span className="tw-text-blue-200/90">
            {formatNumberWithCommas(nicOutcome.value)}
          </span>
        </div>
      ))}
      {repOutcomes.map((repOutcome) => (
        <div
          key={`REP-${repOutcome.category}-${repOutcome.value}`}
          className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-0.5"
        >
          <span className="tw-font-medium tw-text-iron-50">Rep</span>
          <span className="tw-text-purple-200/90">
            {formatNumberWithCommas(repOutcome.value)}
          </span>
          {repOutcome.category.length > 0 && (
            <>
              <span className="tw-size-[2px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-300/70" />
              <span className="tw-text-purple-200/90">
                {repOutcome.category}
              </span>
            </>
          )}
        </div>
      ))}
      {manualOutcomes.map((outcome) => (
        <div
          key={`MANUAL-${outcome.description}`}
          className="tw-flex tw-items-center tw-gap-x-1.5"
        >
          <span className="tw-text-amber-100/90">{outcome.description}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700/20 tw-bg-iron-800/40 tw-px-3 tw-py-1.5 tw-backdrop-blur-sm tw-transition-all tw-duration-200 hover:tw-border-iron-700/40 hover:tw-bg-iron-800/60 hover:tw-shadow-lg"
        data-tooltip-id={tooltipId}
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">
          Outcome
        </span>
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        {tooltipContent}
      </Tooltip>
    </>
  );
};
