import React from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
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

  // Colors for each rank
  let colorClasses = "";
  let rankText = "";

  switch (rank) {
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
      rankText = `${rank}${getOrdinalSuffix(rank)}`;
  }

  return (
    <div
      className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-semibold tw-border tw-border-solid tw-whitespace-nowrap tw-w-fit ${colorClasses}`}>
      <FontAwesomeIcon icon={faTrophy} className="tw-size-2.5" />
      {rankText}
    </div>
  );
};