"use client";

import { RateChangeType } from "./DropListItemRateGive";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";

export default function DropListItemRateGiveChangeButton({
  type,
  canVote,
  handleMouseDown,
  handleMouseUp,
  isMobile = false,
}: {
  readonly type: RateChangeType;
  readonly canVote: boolean;
  readonly handleMouseDown: (changeType: RateChangeType) => void;
  readonly handleMouseUp: () => void;
  readonly isMobile?: boolean;
}) {
  const { connectionStatus } = useContext(AuthContext);

  const svgpaths: Record<RateChangeType, string> = {
    [RateChangeType.INCREASE]: "M18 15L12 9L6 15",
    [RateChangeType.DECREASE]: "M6 9L12 15L18 9",
  };

  const ariaLabels: Record<RateChangeType, string> = {
    [RateChangeType.INCREASE]: "Choose positive votes",
    [RateChangeType.DECREASE]: "Choose negative votes",
  };

  const onMouseDown = () => {
    if (connectionStatus !== ProfileConnectedStatus.HAVE_PROFILE) {
      return;
    }
    handleMouseDown(type);
  };

  const onMouseUpOrLeave = () => {
    if (connectionStatus !== ProfileConnectedStatus.HAVE_PROFILE) {
      return;
    }
    handleMouseUp();
  };

  const getButtonClasses = (ratingAllowed: boolean) => {
    if (ratingAllowed) {
      return "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-text-iron-300";
    }
    return "tw-text-iron-500";
  };

  const [buttonClasses, setButtonClasses] = useState<string | null>(
    getButtonClasses(canVote)
  );

  useEffect(() => {
    setButtonClasses(getButtonClasses(canVote));
  }, [canVote]);

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        onMouseUpOrLeave();
      }}
      onMouseLeave={onMouseUpOrLeave}
      onClick={(e) => e.stopPropagation()}
      disabled={!canVote}
      aria-label={ariaLabels[type]}
      className={`tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-lg tw-ring-1 tw-ring-iron-700/50 tw-text-iron-300 tw-transition-all tw-duration-300 ${
        isMobile
          ? "tw-bg-iron-800 tw-size-10 active:tw-bg-iron-600 active:tw-scale-95"
          : "tw-bg-iron-900 tw-size-6 hover:tw-bg-iron-800 hover:tw-ring-iron-600/50 hover:tw-text-iron-200"
      } tw-transition-all tw-duration-150 ${buttonClasses}`}>
      <svg
        className={`${
          isMobile ? "tw-size-6" : "tw-size-4"
        } tw-rotate-90 tw-flex-shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d={svgpaths[type]}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
