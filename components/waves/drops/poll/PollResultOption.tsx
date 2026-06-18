"use client";

import type { ApiDropPollOption } from "@/generated/models/ApiDropPollOption";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { CSSProperties, MouseEvent } from "react";
import { getVoteCountLabel } from "./WaveDropPoll.helpers";

interface PollResultOptionProps {
  readonly option: ApiDropPollOption;
  readonly totalVotes: number;
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
  readonly isDimmed: boolean;
  readonly isExpanded: boolean;
  readonly showSelectionIndicator: boolean;
  readonly onToggle: (optionNo: number) => void;
}

const getSelectionClassName = ({
  canShowVoters,
  isSelected,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
}): string => {
  if (isSelected) {
    return "tw-border-iron-600 tw-bg-iron-800 tw-shadow-[0_0_15px_rgba(245,245,245,0.04)]";
  }

  if (canShowVoters) {
    return "tw-border-iron-800 tw-bg-iron-800/60 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-800/80";
  }

  return "tw-border-iron-800 tw-bg-iron-800/60";
};

const getPollResultOptionClassName = ({
  canShowVoters,
  isSelected,
  isDimmed,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
  readonly isDimmed: boolean;
}): string => {
  const selectionClassName = getSelectionClassName({
    canShowVoters,
    isSelected,
  });
  const opacityClassName = isDimmed
    ? "tw-opacity-80 desktop-hover:hover:tw-opacity-100"
    : "tw-opacity-100";
  const interactionClassName = canShowVoters
    ? "tw-cursor-pointer focus-visible:tw-ring-2 focus-visible:tw-ring-white/30"
    : "tw-cursor-default";

  return `tw-group/result tw-relative tw-flex tw-min-h-11 tw-w-full tw-transform-gpu tw-items-stretch tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-p-0 tw-text-left tw-outline-none tw-transition-all tw-duration-300 ${interactionClassName} ${selectionClassName} ${opacityClassName}`;
};

function PollResultSelectedMarker() {
  return (
    <span
      className="tw-mt-0.5 tw-flex tw-size-4 tw-shrink-0 tw-scale-110 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-50 tw-bg-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover/result:tw-scale-100 desktop-hover:group-hover/result:tw-border-iron-200 desktop-hover:group-hover/result:tw-bg-iron-200"
      aria-hidden="true"
    >
      <CheckIcon
        className="tw-size-2.5 tw-text-iron-950 tw-transition-all tw-duration-300"
        strokeWidth={3}
      />
    </span>
  );
}

const getPollResultLabelClassName = ({
  canShowVoters,
  isSelected,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
}): string => {
  if (isSelected) {
    return "tw-font-medium tw-text-iron-50";
  }

  if (canShowVoters) {
    return "tw-font-medium tw-text-iron-100 desktop-hover:group-hover/result:tw-text-iron-50";
  }

  return "tw-font-medium tw-text-iron-100";
};

function PollResultOptionLabel({
  canShowVoters,
  isSelected,
  optionString,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
  readonly optionString: string;
}) {
  const labelClassName = getPollResultLabelClassName({
    canShowVoters,
    isSelected,
  });

  return (
    <span
      className={`tw-[overflow-wrap:anywhere] tw-min-w-0 tw-break-words tw-text-[13px] tw-leading-5 tw-transition-colors tw-duration-300 ${labelClassName}`}
    >
      {optionString}
    </span>
  );
}

const getPollResultVoteCountClassName = ({
  canShowVoters,
  isSelected,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
}): string => {
  if (isSelected) {
    return "tw-text-iron-200";
  }

  if (canShowVoters) {
    return "tw-text-iron-300 desktop-hover:group-hover/result:tw-text-iron-200";
  }

  return "tw-text-iron-300";
};

const getPollResultPercentageClassName = ({
  canShowVoters,
  isSelected,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
}): string => {
  if (isSelected) {
    return "tw-text-iron-100";
  }

  if (canShowVoters) {
    return "tw-text-iron-200 desktop-hover:group-hover/result:tw-text-iron-100";
  }

  return "tw-text-iron-200";
};

function PollResultOptionStats({
  canShowVoters,
  isExpanded,
  isSelected,
  option,
  percentage,
}: {
  readonly canShowVoters: boolean;
  readonly isExpanded: boolean;
  readonly isSelected: boolean;
  readonly option: ApiDropPollOption;
  readonly percentage: number;
}) {
  const voteCountClassName = getPollResultVoteCountClassName({
    canShowVoters,
    isSelected,
  });
  const percentageClassName = getPollResultPercentageClassName({
    canShowVoters,
    isSelected,
  });
  const chevronClassName = isExpanded ? "tw-rotate-180" : "";

  return (
    <div className="tw-ml-0 tw-flex tw-h-5 tw-flex-shrink-0 tw-translate-x-0 tw-animate-poll-result-stats-in tw-items-center tw-gap-2.5 tw-opacity-100 tw-transition-all tw-duration-500 motion-reduce:tw-animate-none sm:tw-ml-2">
      <span className="tw-flex tw-h-5 tw-items-center tw-gap-1.5">
        <span
          className={`tw-text-[11.5px] tw-font-medium tw-transition-colors ${voteCountClassName}`}
        >
          {getVoteCountLabel(option.votes)}
        </span>
      </span>
      <span
        className={`tw-w-8 tw-text-right tw-text-xs tw-font-bold tw-transition-colors ${percentageClassName}`}
      >
        {percentage}%
      </span>
      {canShowVoters && (
        <ChevronDownIcon
          className={`tw-size-3.5 tw-flex-shrink-0 tw-text-iron-600 tw-transition-transform tw-duration-200 desktop-hover:group-hover/result:tw-text-iron-400 ${chevronClassName}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

const getPollResultFillClassName = ({
  canShowVoters,
  isSelected,
}: {
  readonly canShowVoters: boolean;
  readonly isSelected: boolean;
}): string => {
  if (isSelected) {
    return "tw-bg-iron-700";
  }

  if (canShowVoters) {
    return "tw-bg-iron-800 desktop-hover:group-hover/result:tw-bg-iron-700";
  }

  return "tw-bg-iron-800";
};

export function PollResultOption({
  option,
  totalVotes,
  canShowVoters,
  isSelected,
  isDimmed,
  isExpanded,
  showSelectionIndicator,
  onToggle,
}: PollResultOptionProps) {
  const percentage =
    totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  const fillScale = Math.max(0, Math.min(100, percentage)) / 100;
  const canShowOptionVoters = canShowVoters && option.votes > 0;
  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle(option.option_no);
  };
  const optionClassName = getPollResultOptionClassName({
    canShowVoters: canShowOptionVoters,
    isSelected,
    isDimmed,
  });
  const fillClassName = getPollResultFillClassName({
    canShowVoters: canShowOptionVoters,
    isSelected,
  });
  const fillStyle = {
    "--poll-result-fill-scale": fillScale.toString(),
  } as CSSProperties;
  const selectedAriaLabel = isSelected ? " Your vote." : "";

  const optionContent = (
    <>
      <div
        className={`tw-absolute tw-inset-y-0 tw-left-0 tw-w-full tw-origin-left tw-scale-x-[var(--poll-result-fill-scale)] tw-transform-gpu tw-animate-poll-result-fill tw-transition-[background-color] tw-duration-700 tw-ease-out motion-reduce:tw-animate-none ${fillClassName}`}
        style={fillStyle}
        aria-hidden="true"
      />
      <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-gap-2 tw-px-3.5 tw-py-3 sm:tw-flex-row sm:tw-justify-between sm:tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-2.5">
          {showSelectionIndicator && isSelected && <PollResultSelectedMarker />}
          <PollResultOptionLabel
            canShowVoters={canShowOptionVoters}
            isSelected={isSelected}
            optionString={option.option_string}
          />
        </div>
        <PollResultOptionStats
          canShowVoters={canShowOptionVoters}
          isExpanded={isExpanded}
          isSelected={isSelected}
          option={option}
          percentage={percentage}
        />
      </div>
    </>
  );

  return (
    <div className="tw-overflow-hidden tw-rounded-lg">
      {canShowOptionVoters ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Hide" : "View"} voters for ${
            option.option_string
          }. ${getVoteCountLabel(
            option.votes
          )}, ${percentage} percent.${selectedAriaLabel}`}
          onClick={handleToggle}
          className={optionClassName}
        >
          {optionContent}
        </button>
      ) : (
        <div className={optionClassName}>{optionContent}</div>
      )}
    </div>
  );
}
