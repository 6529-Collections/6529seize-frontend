import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";

interface WaveLeaderboardDropRankIndicatorProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropRankIndicator: React.FC<
  WaveLeaderboardDropRankIndicatorProps
> = ({ drop }) => {
  const rankNumber = drop.rank;
  
  // Get rank text (1st, 2nd, 3rd, etc.)
  let rankText = "";
  if (rankNumber) {
    switch (rankNumber) {
      case 1:
        rankText = "1st";
        break;
      case 2:
        rankText = "2nd";
        break;
      case 3:
        rankText = "3rd";
        break;
      default:
        rankText = `${rankNumber}th`;
    }
  } else {
    rankText = "-";
  }

  // Colors for each rank
  let accentColor = "";
  let bgColor = "";

  switch (rankNumber) {
    case 1:
      accentColor = "#fbbf24"; // Gold
      bgColor = "rgba(251,191,36,0.1)";
      break;
    case 2:
      accentColor = "#94a3b8"; // Silver
      bgColor = "rgba(148,163,184,0.1)";
      break;
    case 3:
      accentColor = "#CD7F32"; // Bronze
      bgColor = "rgba(205,127,50,0.1)";
      break;
    default:
      accentColor = "#848490"; // Default for 4th or higher
      bgColor = "rgba(96,96,108,0.1)";
  }

  return (
    <div
      className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap tw-text-xs"
      style={{
        backgroundColor: bgColor,
        color: accentColor,
        border: `1px solid ${accentColor}40`,
      }}
    >
      <span className="tw-px-1.5 tw-py-0.5 tw-flex tw-items-center">
        {rankText}
      </span>
    </div>
  );
};
