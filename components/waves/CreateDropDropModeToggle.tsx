"use client";

import { Tooltip } from "react-tooltip";
import React, { useMemo } from "react";
import type { DropPrivileges } from "@/hooks/useDropPriviledges";
import {
  ChatRestriction,
  SubmissionRestriction,
} from "@/hooks/useDropPriviledges";

interface CreateDropDropModeToggleProps {
  readonly isDropMode: boolean;
  readonly onDropModeChange: (isDropMode: boolean) => void;
  readonly privileges: DropPrivileges;
  readonly exitLabel?: string | null;
}

export const CreateDropDropModeToggle: React.FC<
  CreateDropDropModeToggleProps
> = ({ isDropMode, onDropModeChange, privileges, exitLabel = null }) => {
  const { chatRestriction, submissionRestriction } = privileges;
  const hasExitLabel = exitLabel !== null;
  const hasChatRestriction = chatRestriction !== null;
  const hasSubmissionRestriction = submissionRestriction !== null;
  const isExitOnly = isDropMode && hasExitLabel;
  const isDisabled =
    !isExitOnly &&
    ((isDropMode && hasChatRestriction) ||
      (!isDropMode && hasSubmissionRestriction));
  const canToggle =
    isExitOnly ||
    (isDropMode ? !hasChatRestriction : !hasSubmissionRestriction);
  const targetRestriction = isDropMode
    ? chatRestriction
    : submissionRestriction;
  const handleToggleClick = canToggle
    ? () => onDropModeChange(isExitOnly ? false : !isDropMode)
    : undefined;

  const buttonClassName = useMemo(() => {
    const baseClasses =
      "tw-group tw-relative tw-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-transparent tw-text-sm tw-transition-all active:tw-scale-95 md:tw-h-10 md:tw-w-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2";

    if (isDisabled) {
      return `${baseClasses} tw-opacity-50 tw-cursor-not-allowed ${
        isDropMode
          ? "tw-bg-primary-600 tw-text-white"
          : "tw-bg-white/[0.06] tw-text-iron-500"
      }`;
    }

    if (isDropMode) {
      return `${baseClasses} tw-bg-primary-600 tw-text-white desktop-hover:hover:tw-bg-primary-500 focus-visible:tw-outline-primary-500`;
    }

    return `${baseClasses} tw-bg-white/[0.06] tw-text-iron-300 desktop-hover:hover:tw-bg-white/[0.12] desktop-hover:hover:tw-text-white focus-visible:tw-outline-iron-500`;
  }, [isDisabled, isDropMode]);

  const getRestrictionMessage = (
    restriction: ChatRestriction | SubmissionRestriction,
    isChat: boolean
  ): string => {
    switch (restriction) {
      case ChatRestriction.NOT_LOGGED_IN:
      case SubmissionRestriction.NOT_LOGGED_IN:
        return `Please log in to ${isChat ? "drop" : "chat"}`;
      case ChatRestriction.PROXY_USER:
      case SubmissionRestriction.PROXY_USER:
        return `Proxy users cannot ${isChat ? "drop" : "chat"}`;
      case ChatRestriction.NO_PERMISSION:
      case SubmissionRestriction.NO_PERMISSION:
        return `You don't have permission to ${isChat ? "drop" : "chat"}`;
      case ChatRestriction.DISABLED:
        return "Chat is currently disabled";
      case SubmissionRestriction.NOT_STARTED:
        return "Drop submissions haven't started yet";
      case SubmissionRestriction.ENDED:
        return "Drop submissions have ended";
      case SubmissionRestriction.MAX_DROPS_REACHED:
        return "You have reached the maximum number of drops allowed";
      default:
        return `${isChat ? "Drop" : "Chat"} mode is unavailable`;
    }
  };

  const tooltipContent = useMemo(() => {
    if (isExitOnly) {
      return <span className="tw-text-xs">{exitLabel}</span>;
    }

    if (!isDisabled && canToggle) {
      return (
        <span className="tw-text-xs">
          Switch to {isDropMode ? "Chat" : "Drop"} Mode
        </span>
      );
    }

    if (targetRestriction !== null) {
      return (
        <span className="tw-text-xs">
          {getRestrictionMessage(targetRestriction, !isDropMode)}
        </span>
      );
    }

    return (
      <span className="tw-text-xs">
        {isDropMode ? "Chat" : "Drop"} mode is unavailable
      </span>
    );
  }, [
    isDropMode,
    isDisabled,
    canToggle,
    targetRestriction,
    isExitOnly,
    exitLabel,
  ]);

  return (
    <>
      <div>
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isDisabled}
          className={buttonClassName}
          data-tooltip-id="drop-mode-toggle"
        >
          <svg
            className="tw-h-4.5 tw-w-4.5 tw-flex-shrink-0 tw-transition-colors md:tw-h-5 md:tw-w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
            <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
          </svg>
          {!isDropMode && (
            <span className="tw-absolute tw-right-1 tw-top-1 tw-flex tw-h-2.5 tw-w-2.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950">
              <span className="tw-text-[9px] tw-font-black tw-leading-none tw-text-primary-400">
                +
              </span>
            </span>
          )}
        </button>
      </div>
      <Tooltip
        id="drop-mode-toggle"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {tooltipContent}
      </Tooltip>
    </>
  );
};
