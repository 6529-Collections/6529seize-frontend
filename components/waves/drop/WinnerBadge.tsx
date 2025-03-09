import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";

interface WinnerBadgeProps {
  readonly drop: ApiDrop;
}

export const WinnerBadge: React.FC<WinnerBadgeProps> = ({ drop }) => {
  const { winningRank } = useDropInteractionRules(drop);
  const winningTime = drop.winning_context?.decision_time;
  
  if (!winningRank) return null;

  const formattedDate = winningTime
    ? new Date(winningTime).toLocaleString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  let accentColor = "";
  let bgColor = "";
  let rankText = "";

  switch (winningRank) {
    case 1:
      accentColor = "#fbbf24";
      bgColor = "rgba(251,191,36,0.1)";
      rankText = "1st Place";
      break;
    case 2:
      accentColor = "#94a3b8";
      bgColor = "rgba(148,163,184,0.1)";
      rankText = "2nd Place";
      break;
    case 3:
      accentColor = "#CD7F32";
      bgColor = "rgba(205,127,50,0.1)";
      rankText = "3rd Place";
      break;
    default:
      accentColor = "#848490";
      bgColor = "rgba(96,96,108,0.1)";
      rankText = `${winningRank}th Place`;
  }

  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
      <div
        className="tw-flex tw-items-center tw-rounded-lg tw-font-medium tw-p-3 tw-shadow-inner tw-shadow-black/20"
        style={{
          backgroundColor: bgColor,
          color: accentColor,
          border: `1px solid ${accentColor}40`,
        }}
      >
        <div className="tw-flex tw-flex-col tw-w-full">
          <div className="tw-flex tw-items-center tw-justify-center tw-mb-1">
            <span className="tw-flex tw-items-center tw-text-lg tw-font-semibold">
              <FontAwesomeIcon icon={faTrophy} className="tw-mr-2 tw-size-5" />
              {rankText}
            </span>
          </div>
          
          {formattedDate && (
            <div className="tw-flex tw-items-center tw-justify-center tw-text-sm">
              <FontAwesomeIcon icon={faClock} className="tw-mr-2 tw-size-4" />
              <span>Won on {formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
