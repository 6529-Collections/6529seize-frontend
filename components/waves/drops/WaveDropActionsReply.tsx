import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

interface WaveDropActionsReplyProps {
  readonly drop: ApiDrop;
  readonly activePartIndex: number;
  readonly onReply: () => void;
}

const WaveDropActionsReply: React.FC<WaveDropActionsReplyProps> = ({
  onReply,
  drop,
}) => {
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const canReply =
    drop.wave.authenticated_user_eligible_to_chat && !isTemporaryDrop;

  return (
    <Tippy
      content={
        <div className="tw-text-center">
          <span
            className={`tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out`}
          >
            {canReply ? "Reply" : "You can't reply to this drop"}
          </span>
        </div>
      }
      placement="top"
      disabled={isTemporaryDrop}
    >
      <div>
        <button
          className={`tw-text-iron-500 icon tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 ${
            !canReply ? "tw-opacity-50 tw-cursor-default" : "tw-cursor-pointer"
          }`}
          onClick={canReply ? onReply : undefined}
          disabled={!canReply}
          aria-label="Reply to drop"
        >
          <svg
            className={`tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300 ${
              !canReply ? "tw-opacity-50" : ""
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
      </div>
    </Tippy>
  );
};

export default WaveDropActionsReply;
