"use client";

import React, { useContext } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { Tooltip } from "react-tooltip";
import { AuthContext } from "@/components/auth/Auth";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";

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
  const isEligibleToChat =
    waveEligibility?.authenticated_user_eligible_to_chat ??
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
        className={`tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200 ${
          !canReply ? "tw-cursor-default tw-opacity-50" : "tw-cursor-pointer"
        }`}
        onClick={canReply ? handleReplyClick : undefined}
        disabled={!canReply}
        aria-label="Reply to drop"
        {...(!isTemporaryDrop ? { "data-tooltip-id": `reply-${drop.id}` } : {})}
      >
        <svg
          className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out ${
            canReply ? "" : "tw-opacity-50"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
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
          offset={8}
          opacity={1}
          style={{
            padding: "4px 8px",
            background: "#37373E",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <span className="tw-text-xs">Reply</span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsReply;
