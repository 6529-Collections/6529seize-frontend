"use client";

import React, { useState, useEffect } from "react";
import Tippy from "@tippyjs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import { faAward } from "@fortawesome/free-solid-svg-icons";

import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveOutcomeCredit } from "../../../generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "../../../generated/models/ApiWaveOutcomeType";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface WaveSmallLeaderboardItemOutcomesProps {
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

export const WaveSmallLeaderboardItemOutcomes: React.FC<
  WaveSmallLeaderboardItemOutcomesProps
> = ({ drop, wave, isMobile = false }) => {
  const [isTouch, setIsTouch] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (isTouch) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  const { nicTotal, repTotal, manualOutcomes } = calculateOutcomeSummary({
    drop,
    wave,
  });
  const totalOutcomes =
    (nicTotal ? 1 : 0) + (repTotal ? 1 : 0) + manualOutcomes.length;

  if (totalOutcomes === 0) {
    return null;
  }

  const tooltipContent = (
    <div className="tw-p-3 tw-space-y-3 tw-min-w-[200px]">
      <div className="tw-space-y-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          Outcome
        </span>
        <div className="tw-space-y-1.5">
          {!!nicTotal && (
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <FontAwesomeIcon
                  icon={faAddressCard}
                  className="tw-size-4 tw-text-blue-300/70"
                />
                <span className="tw-text-xs tw-font-medium tw-text-iron-300">
                  NIC
                </span>
              </div>
              <span className="tw-text-xs tw-font-medium tw-text-blue-200/90">
                {nicTotal}
              </span>
            </div>
          )}
          {!!repTotal && (
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <FontAwesomeIcon
                  icon={faStar}
                  className="tw-size-4 tw-text-purple-300/70"
                />
                <span className="tw-text-xs tw-font-medium tw-text-iron-300">
                  Rep
                </span>
              </div>
              <span className="tw-text-xs tw-font-medium tw-text-purple-200/90">
                {repTotal}
              </span>
            </div>
          )}
          {manualOutcomes.map((outcome) => (
            <div
              key={outcome}
              className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <FontAwesomeIcon
                  icon={faAward}
                  className="tw-size-4 tw-text-amber-300/70"
                />
                <span className="tw-text-xs tw-font-medium tw-text-amber-100/90">
                  {outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Tippy
      content={tooltipContent}
      placement="top"
      animation="shift-away"
      visible={isTouch ? isOpen : undefined}
      onClickOutside={() => setIsOpen(false)}>
      <button
        onClick={handleClick}
        className={`tw-border-0 tw-rounded-lg tw-flex tw-items-center ${
          isMobile ? "tw-gap-4" : "tw-gap-2"
        } tw-min-w-6 tw-py-1.5 tw-px-2 tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 ${
          isTouch ? "tw-cursor-pointer" : ""
        }`}>
        <span className="tw-text-xs tw-font-medium tw-text-iron-200">
          Outcome:
        </span>
        <div className="tw-flex tw-items-center tw-gap-2">
          {!!nicTotal && (
            <FontAwesomeIcon
              icon={faAddressCard}
              className="tw-size-4 tw-text-blue-300/70 tw-flex-shrink-0"
            />
          )}
          {!!repTotal && (
            <FontAwesomeIcon
              icon={faStar}
              className="tw-size-4 tw-text-purple-300/70 tw-flex-shrink-0"
            />
          )}
          {manualOutcomes.length > 0 && (
            <FontAwesomeIcon
              icon={faAward}
              className="tw-size-4 tw-text-amber-300/70 tw-flex-shrink-0"
            />
          )}
        </div>
      </button>
    </Tippy>
  );
};
