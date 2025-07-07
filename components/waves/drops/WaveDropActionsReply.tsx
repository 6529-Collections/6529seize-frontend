"use client";

import React, { useContext } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { Tooltip } from "react-tooltip";
import { AuthContext } from "../../auth/Auth";
import { useWaveEligibility } from "../../../contexts/wave/WaveEligibilityContext";

interface WaveDropActionsReplyProps {
  readonly drop: ApiDrop;
  readonly activePartIndex: number;
  readonly onReply: () => void;
}

const WaveDropActionsReply: React.FC<WaveDropActionsReplyProps> = ({
  onReply,
  drop,
}) => {
  const { setToast } = useContext(AuthContext);
  const { getEligibility } = useWaveEligibility();
  const isTemporaryDrop = drop.id.startsWith("temp-");
  
  // Check centralized eligibility first, fallback to drop's eligibility
  const waveEligibility = getEligibility(drop.wave.id);
  const isEligibleToChat = waveEligibility?.authenticated_user_eligible_to_chat ?? 
                          drop.wave.authenticated_user_eligible_to_chat;
  
  const canReply = !isTemporaryDrop;

  const handleReplyClick = () => {
    if (isEligibleToChat === false) {
      setToast({
        message: "You are not eligible to chat in this wave",
        type: "error",
      });
      return;
    }
    onReply();
  };

  return (
    <>
      <button
        className={`tw-text-iron-500 icon tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 ${
          !canReply ? "tw-opacity-50 tw-cursor-default" : "tw-cursor-pointer"
        }`}
        onClick={canReply ? handleReplyClick : undefined}
        disabled={!canReply}
        aria-label="Reply to drop"
        data-tooltip-id={!isTemporaryDrop ? `reply-${drop.id}` : undefined}>
        <svg
          className={`tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300 ${
            !canReply ? "tw-opacity-50" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.49 12 3.74 8.248m0 0 3.75-3.75m-3.75 3.75h16.5V19.5"
          />
        </svg>
      </button>
      {!isTemporaryDrop && (
        <Tooltip
          id={`reply-${drop.id}`}
          place="top"
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "4px 8px",
          }}>
          <span className="tw-text-xs">Reply</span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsReply;
