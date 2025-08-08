import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";

interface ProfileWinnerBadgeProps {
  readonly winCount: number;
}

export const ProfileWinnerBadge: React.FC<ProfileWinnerBadgeProps> = ({
  winCount
}) => {
  if (winCount === 0) return null;

  return (
    <div className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-font-medium tw-whitespace-nowrap tw-border tw-size-5 tw-text-xs tw-bg-amber-400/10 tw-border-amber-400/25 tw-text-amber-400">
      <FontAwesomeIcon 
        icon={faTrophy} 
        className="tw-size-2.5 tw-text-amber-400 tw-flex-shrink-0"
      />
    </div>
  );
};