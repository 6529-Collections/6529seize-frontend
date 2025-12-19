import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import WinnerDropBadge from "../drops/winner/WinnerDropBadge";

interface SingleWaveDropPositionProps {
  readonly rank: number | null;
  readonly drop?: ExtendedDrop;
  readonly isFinalWinner?: boolean;
  readonly variant?: "default" | "simple";
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

// Simple variant - just trophy icon + number, no box
const SimpleRankDisplay: React.FC<{ rank: number }> = ({ rank }) => {
  let color = "";
  switch (rank) {
    case 1:
      color = "tw-text-amber-400";
      break;
    case 2:
      color = "tw-text-iron-300";
      break;
    case 3:
      color = "tw-text-amber-600";
      break;
    default:
      color = "tw-text-iron-500";
  }

  // Format rank as ordinal for top 3, otherwise use #N
  const formatRank = (r: number) => {
    switch (r) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return `#${r}`;
    }
  };

  return (
    <div className={`tw-flex tw-items-center tw-gap-1.5 ${color}`}>
      <FontAwesomeIcon icon={faTrophy} className="tw-w-3.5 tw-h-3.5" />
      <span className="tw-text-sm tw-font-semibold">{formatRank(rank)}</span>
    </div>
  );
};

export const SingleWaveDropPosition: React.FC<SingleWaveDropPositionProps> = ({
  rank,
  drop,
  isFinalWinner = false,
  variant = "default",
}) => {
  if (!rank) return null;

  // Simple variant - just trophy + number
  if (variant === "simple") {
    return <SimpleRankDisplay rank={rank} />;
  }

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
