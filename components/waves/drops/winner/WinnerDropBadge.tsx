import React from "react";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface WinnerDropBadgeProps {
  rank: number | null;
  round?: number;
  position?: number; // Position within the same rank (e.g., 2nd #1 place winner)
  decisionTime: number | null; // Add decision time parameter
}

const WinnerDropBadge: React.FC<WinnerDropBadgeProps> = ({
  rank,
  round = 1,
  position = 1,
  decisionTime,
}) => {
  // If rank is null or undefined, use position as fallback
  const effectiveRank = rank !== null && rank !== undefined ? rank : position;
  if (!effectiveRank) return null;

  // Convert rank to a number to ensure proper comparison
  const rankNumber =
    typeof effectiveRank === "string"
      ? parseInt(effectiveRank, 10)
      : effectiveRank;

  // Format separate date and time for responsive display
  const dateTime = decisionTime ? new Date(decisionTime) : null;

  // Date string (e.g. "Mar 21")
  const dateString = dateTime
    ? dateTime.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  // Time string (e.g. "12:30 PM") - will only show on sm screens and up
  const timeString = dateTime
    ? dateTime.toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Colors for each rank
  let accentColor = "";
  let bgColor = "";
  let rankText = "";

  switch (rankNumber) {
    case 1:
      accentColor = "#fbbf24"; // amber-400 - Gold from ParticipationDrop
      bgColor = "rgba(251,191,36,0.1)";
      rankText = "1st";
      break;
    case 2:
      accentColor = "#CAD5E3"; // slate-400 - Silver from ParticipationDrop
      bgColor = "rgba(202, 213, 227,0.1)";
      rankText = "2nd";
      break;
    case 3:
      accentColor = "#CD7F32"; // Bronze
      bgColor = "rgba(205,127,50,0.1)";
      rankText = "3rd";
      break;
    default:
      accentColor = "#848490"; // iron-600 from Tailwind config
      bgColor = "rgba(96,96,108,0.1)";
      rankText = `${rankNumber}th`;
  }

  return (
    <div
      className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap"
      style={{
        backgroundColor: bgColor,
        color: accentColor,
        border: `1px solid ${accentColor}30`,
      }}
    >
      {/* Rank part */}
      <span className="tw-px-2 tw-py-0.5 tw-text-xs tw-flex tw-items-center">
        <FontAwesomeIcon icon={faTrophy} className="tw-mr-1.5 tw-size-2.5" />
        {rankText}
        {position > 1 && <span className="tw-ml-1">#{position}</span>}
      </span>

      {/* Date part - always show if available */}
      {dateString && (
        <span className="tw-flex tw-items-center">
          <div
            style={{
              backgroundColor: `${accentColor}70`,
            }}
            className="tw-size-[3px] tw-rounded-full"
          ></div>
          <span
            className="tw-border-l tw-px-2 tw-py-0.5 tw-flex tw-items-center tw-text-xs"
            style={{
              borderColor: `${accentColor}30`,
            }}
          >
            <FontAwesomeIcon icon={faClock} className="tw-mr-1.5 tw-size-2.5" />
            {dateString}
            {/* Time only shows on sm breakpoint and up */}
            {timeString && (
              <span className="tw-hidden sm:tw-inline">, {timeString}</span>
            )}
          </span>
        </span>
      )}
    </div>
  );
};

export default WinnerDropBadge;
