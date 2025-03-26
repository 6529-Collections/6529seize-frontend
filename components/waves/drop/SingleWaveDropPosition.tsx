import React from "react";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface SingleWaveDropPositionProps {
  readonly rank: number | null;
  readonly drop?: ExtendedDrop;
  readonly isFinalWinner?: boolean;
}

// Trophy-only badge component for completed Memes waves
const TrophyOnlyBadge: React.FC<{ rank: number }> = ({ rank }) => {
  // Colors for each rank (same as in WinnerDropBadge)
  let accentColor = "";
  let bgColor = "";

  switch (rank) {
    case 1:
      accentColor = "#fbbf24"; // Gold
      bgColor = "rgba(251,191,36,0.1)";
      break;
    case 2:
      accentColor = "#CAD5E3"; // Silver
      bgColor = "rgba(202, 213, 227,0.1)";
      break;
    case 3:
      accentColor = "#CD7F32"; // Bronze
      bgColor = "rgba(205,127,50,0.1)";
      break;
    default:
      accentColor = "#848490"; // iron-600
      bgColor = "rgba(96,96,108,0.1)";
  }

  return (
    <div
      className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap -tw-mt-0.5"
      style={{
        backgroundColor: bgColor,
        color: accentColor,
        border: `1px solid ${accentColor}30`,
      }}
    >
      <span className="tw-px-2 tw-py-1 tw-text-xs tw-flex tw-items-center">
        <FontAwesomeIcon
          icon={faTrophy}
          className="tw-size-2.5 tw-flex-shrink-0"
        />
      </span>
    </div>
  );
};

export const SingleWaveDropPosition: React.FC<SingleWaveDropPositionProps> = ({
  rank,
  drop,
  isFinalWinner = false,
}) => {
  if (!rank) return null;

  // Check if the drop has winning_context or manual override with isFinalWinner prop
  const isWinner = isFinalWinner || drop?.winning_context;

  if (isWinner) {
    return (
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
        <TrophyOnlyBadge rank={rank} />
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
      <WinnerDropBadge rank={rank} decisionTime={null} />
    </div>
  );
};
