import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatOrdinal } from "@/helpers/format.helpers";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SubmissionPositionProps {
  readonly drop: ApiDrop;
}

export const SubmissionPosition: React.FC<SubmissionPositionProps> = ({ drop }) => {
  const rank = drop.rank;

  if (!rank) return null;

  // Colors for each rank
  let colorClasses = "";
  const rankText = formatOrdinal(rank);

  switch (rank) {
    case 1:
      colorClasses = "tw-bg-yellow-500/10 tw-text-yellow-400 tw-border-yellow-500/20";
      break;
    case 2:
      colorClasses = "tw-bg-iron-400/10 tw-text-iron-300 tw-border-iron-400/20";
      break;
    case 3:
      colorClasses = "tw-bg-amber-600/10 tw-text-amber-500 tw-border-amber-600/20";
      break;
    default:
      colorClasses = "tw-bg-iron-600/20 tw-text-iron-400 tw-border-iron-600/20";
  }

  return (
    <div
      className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-semibold tw-border tw-border-solid tw-whitespace-nowrap tw-w-fit ${colorClasses}`}>
      <FontAwesomeIcon icon={faTrophy} className="tw-size-2.5" />
      {rankText}
    </div>
  );
};
