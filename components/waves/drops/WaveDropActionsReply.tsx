"use client";

import React, { useContext } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import DropActionTooltip from "./DropActionTooltip";
import { AuthContext } from "@/components/auth/Auth";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isDropReplyEligible } from "@/helpers/waves/drop-reply-eligibility";

interface WaveDropActionsReplyProps {
  readonly drop: ApiDrop;
  readonly activePartIndex: number;
  readonly onReply: () => void;
}

const WaveDropActionsReply: React.FC<WaveDropActionsReplyProps> = ({
  onReply,
  drop,
}) => {
  const locale = useBrowserLocale();
  const { setToast } = useContext(AuthContext);
  const { getEligibility } = useWaveEligibility();
  const isTemporaryDrop = drop.id.startsWith("temp-");

  const canReply = !isTemporaryDrop;

  const handleReplyClick = () => {
    if (!isDropReplyEligible(drop, getEligibility(drop.wave.id))) {
      setToast({
        message: t(locale, "waves.drop.actions.replyUnavailable"),
        type: "error",
      });
      return;
    }
    onReply();
  };

  return (
    <DropActionTooltip
      content={
        <span className="tw-text-xs">
          {t(locale, "waves.drop.actions.reply")}
        </span>
      }
      disabled={!canReply}
    >
      <button
        className={`tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200 ${
          !canReply ? "tw-cursor-default tw-opacity-50" : "tw-cursor-pointer"
        }`}
        onClick={canReply ? handleReplyClick : undefined}
        disabled={!canReply}
        aria-label={t(locale, "waves.drop.actions.replyToDrop")}
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
    </DropActionTooltip>
  );
};

export default WaveDropActionsReply;
