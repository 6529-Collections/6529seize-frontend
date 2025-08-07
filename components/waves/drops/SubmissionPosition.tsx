import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SubmissionPositionProps {
  readonly drop: ApiDrop;
}

export const SubmissionPosition: React.FC<SubmissionPositionProps> = ({ drop }) => {
  const rank = drop.rank;

  if (!rank) return null;

  // Helper to compute English ordinal suffix
  function getOrdinalSuffix(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return "st";
    if (mod10 === 2 && mod100 !== 12) return "nd";
    if (mod10 === 3 && mod100 !== 13) return "rd";
    return "th";
  }

  // Colors for each rank (matching SingleWaveDropPosition)
  let accentColor = "";
  let bgColor = "";
  let rankText = "";

  switch (rank) {
    case 1:
      accentColor = "#fbbf24"; // Gold
      bgColor = "rgba(251,191,36,0.1)";
      rankText = "1st";
      break;
    case 2:
      accentColor = "#CAD5E3"; // Silver
      bgColor = "rgba(202, 213, 227,0.1)";
      rankText = "2nd";
      break;
    case 3:
      accentColor = "#CD7F32"; // Bronze
      bgColor = "rgba(205,127,50,0.1)";
      rankText = "3rd";
      break;
    default:
      accentColor = "#93939F"; // iron-400
      bgColor = "rgba(147,147,159,0.15)";
      rankText = `${rank}${getOrdinalSuffix(rank)}`;
  }

  return (
    <div
      className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap tw-w-fit"
      style={{
        backgroundColor: bgColor,
        color: accentColor,
        border: `1px solid ${accentColor}40`,
      }}>
      <span className="tw-px-2 tw-py-0.5 tw-text-xs tw-flex tw-items-center">
        <FontAwesomeIcon icon={faTrophy} className="tw-mr-1.5 tw-size-2.5" />
        {rankText}
      </span>
    </div>
  );
};