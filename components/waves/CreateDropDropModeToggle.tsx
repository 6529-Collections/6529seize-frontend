"use client";

import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import React, { useMemo } from "react";
import type { DropPrivileges } from "@/hooks/useDropPriviledges";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  ChatRestriction,
  SubmissionRestriction,
} from "@/hooks/useDropPriviledges";

interface CreateDropDropModeToggleProps {
  readonly isDropMode: boolean;
  readonly onDropModeChange: (isDropMode: boolean) => void;
  readonly privileges: DropPrivileges;
  readonly exitLabel?: string | null;
  readonly inactiveActionLabel?: "drop" | "nominate" | "proposal";
}

export const CreateDropDropModeToggle: React.FC<
  CreateDropDropModeToggleProps
> = ({
  isDropMode,
  onDropModeChange,
  privileges,
  exitLabel = null,
  inactiveActionLabel = "drop",
}) => {
  const { chatRestriction, submissionRestriction } = privileges;
  const hasExitLabel = exitLabel !== null;
  const hasChatRestriction = chatRestriction !== null;
  const hasSubmissionRestriction = submissionRestriction !== null;
  const isExitOnly = isDropMode && hasExitLabel;
  const isIdentityEntry = inactiveActionLabel === "nominate";
  const isProposalEntry = inactiveActionLabel === "proposal";
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
  let inactiveModeLabel = "Drop";
  if (isIdentityEntry) {
    inactiveModeLabel = "Nominate";
  } else if (isProposalEntry) {
    inactiveModeLabel = "Proposal";
  }
  const targetModeLabel = isDropMode ? "Chat" : inactiveModeLabel;

  const buttonClassName = useMemo(() => {
    const baseClasses =
      "tw-group tw-relative tw-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-sm tw-transition-all active:tw-scale-95 md:tw-h-10 md:tw-w-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2";

    if (isDisabled) {
      return `${baseClasses} tw-opacity-50 tw-cursor-not-allowed ${
        isDropMode
          ? "tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/10 tw-text-primary-400"
          : "tw-border tw-border-transparent tw-bg-iron-700 tw-text-iron-500"
      }`;
    }

    if (isDropMode) {
      return `${baseClasses} tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/10 tw-text-primary-400 desktop-hover:hover:tw-border-primary-500/30 desktop-hover:hover:tw-bg-primary-500/20 desktop-hover:hover:tw-text-primary-400 focus-visible:tw-outline-primary-500`;
    }

    return `${baseClasses} tw-border tw-border-transparent tw-bg-iron-700 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700/70 focus-visible:tw-outline-iron-500`;
  }, [isDisabled, isDropMode]);

  const getRestrictionMessage = (
    restriction: ChatRestriction | SubmissionRestriction,
    isChat: boolean
  ): string => {
    let actionLabel = "chat";
    if (isChat && inactiveActionLabel === "proposal") {
      actionLabel = "create a proposal";
    } else if (isChat) {
      actionLabel = inactiveActionLabel;
    }
    switch (restriction) {
      case ChatRestriction.NOT_LOGGED_IN:
      case SubmissionRestriction.NOT_LOGGED_IN:
        return `Please log in to ${actionLabel}`;
      case ChatRestriction.PROXY_USER:
      case SubmissionRestriction.PROXY_USER:
        return `Proxy users cannot ${actionLabel}`;
      case ChatRestriction.NO_PERMISSION:
      case SubmissionRestriction.NO_PERMISSION:
        return `You don't have permission to ${actionLabel}`;
      case ChatRestriction.DISABLED:
        return "Chat is currently disabled";
      case SubmissionRestriction.NOT_STARTED:
        return "Drop submissions haven't started yet";
      case SubmissionRestriction.ENDED:
        return "Drop submissions have ended";
      case SubmissionRestriction.MAX_DROPS_REACHED:
        return "You have reached the maximum number of drops allowed";
      default:
        if (isChat && inactiveActionLabel === "proposal") {
          return "Creating a proposal is unavailable";
        }
        return `${actionLabel} mode is unavailable`;
    }
  };

  const tooltipContent = useMemo(() => {
    if (isExitOnly) {
      return <span className="tw-text-xs">{exitLabel}</span>;
    }

    if (!isDisabled && canToggle) {
      return (
        <span className="tw-text-xs">Switch to {targetModeLabel} Mode</span>
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
      <span className="tw-text-xs">{targetModeLabel} mode is unavailable</span>
    );
  }, [
    isDropMode,
    isDisabled,
    canToggle,
    targetRestriction,
    isExitOnly,
    exitLabel,
    inactiveActionLabel,
    targetModeLabel,
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
          {isIdentityEntry ? (
            <UserPlusIcon
              className="tw-h-4.5 tw-w-4.5 tw-flex-shrink-0 tw-transition-colors md:tw-h-5 md:tw-w-5"
              aria-hidden="true"
            />
          ) : (
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
          )}
        </button>
      </div>
      <Tooltip
        id="drop-mode-toggle"
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        {tooltipContent}
      </Tooltip>
    </>
  );
};
