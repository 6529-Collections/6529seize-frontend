import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface SubmissionPositionProps {
  readonly drop: ApiDrop;
}

export const SubmissionPosition: React.FC<SubmissionPositionProps> = ({ drop }) => {
  const rank = drop.rank;

  if (!rank) {
    return (
      <div className="tw-text-xs tw-text-iron-500">
        Position: -
      </div>
    );
  }

  const getPositionColor = (position: number) => {
    if (position <= 3) return "tw-text-yellow-400";
    if (position <= 10) return "tw-text-green-400";
    if (position <= 50) return "tw-text-blue-400";
    return "tw-text-iron-300";
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `#${position}`;
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-1 tw-text-xs">
      <span className="tw-text-iron-500">Position:</span>
      <span className={`tw-font-medium ${getPositionColor(rank)}`}>
        {getPositionBadge(rank)}
      </span>
    </div>
  );
};