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

  // Helper to compute English ordinal suffix
  function getOrdinalSuffix(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return "st";
    if (mod10 === 2 && mod100 !== 12) return "nd";
    if (mod10 === 3 && mod100 !== 13) return "rd";
    return "th";
  }

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
  let colorClasses = "";
  let rankText = "";

  switch (rankNumber) {
    case 1:
      colorClasses = "tw-bg-yellow-500/10 tw-text-yellow-400 tw-border-yellow-500/20";
      rankText = "1st";
      break;
    case 2:
      colorClasses = "tw-bg-iron-400/10 tw-text-iron-300 tw-border-iron-400/20";
      rankText = "2nd";
      break;
    case 3:
      colorClasses = "tw-bg-amber-600/10 tw-text-amber-500 tw-border-amber-600/20";
      rankText = "3rd";
      break;
    default:
      colorClasses = "tw-bg-iron-600/20 tw-text-iron-400 tw-border-iron-600/20";
      rankText = `${rankNumber}${getOrdinalSuffix(rankNumber)}`;
  }

  return (
    <div
      className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-border tw-border-solid tw-whitespace-nowrap ${colorClasses}`}>
      <FontAwesomeIcon icon={faTrophy} className="tw-size-2.5" />
      {rankText}
      {position > 1 && <span>#{position}</span>}

      {dateString && (
        <span className="tw-hidden md:tw-flex tw-items-center">
          <div className="tw-size-[3px] tw-rounded-full tw-bg-current tw-opacity-70"></div>
          <span className="tw-border-l tw-border-current/40 tw-px-2 tw-flex tw-items-center">
            <FontAwesomeIcon icon={faClock} className="tw-mr-1.5 tw-size-2.5" />
            {dateString}
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
