"use client";

import type { ApiDropPollOption } from "@/generated/models/ApiDropPollOption";
import { usePrefetchDropPollOptionVoters } from "@/hooks/useDropPollOptionVoters";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { type MouseEvent, useEffect, useState } from "react";
import { getVoteCountLabel } from "./WaveDropPoll.helpers";
import { PollOptionVoterPreviews } from "./PollOptionVoters";

interface PollResultOptionProps {
  readonly dropId: string;
  readonly option: ApiDropPollOption;
  readonly totalVotes: number;
  readonly isSelected: boolean;
  readonly isDimmed: boolean;
  readonly isExpanded: boolean;
  readonly multichoice: boolean;
  readonly showSelectionIndicator: boolean;
  readonly onToggle: (optionNo: number) => void;
}

const getPollResultButtonClassName = ({
  isSelected,
  isDimmed,
}: {
  readonly isSelected: boolean;
  readonly isDimmed: boolean;
}): string => {
  const selectionClassName = isSelected
    ? "tw-border-iron-600 tw-bg-iron-800 tw-shadow-[0_0_15px_rgba(245,245,245,0.04)]"
    : "tw-border-iron-700 tw-bg-iron-800/60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/80";
  const opacityClassName = isDimmed
    ? "tw-opacity-80 desktop-hover:hover:tw-opacity-100"
    : "tw-opacity-100";

  return `tw-group/result tw-relative tw-flex tw-min-h-11 tw-w-full tw-transform-gpu tw-cursor-pointer tw-items-stretch tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-p-0 tw-text-left tw-outline-none tw-transition-all tw-duration-300 focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 ${selectionClassName} ${opacityClassName}`;
};

const getSelectionIndicatorStateClassName = (isSelected: boolean): string =>
  isSelected
    ? "tw-scale-110 tw-border-iron-50 tw-bg-iron-50 desktop-hover:group-hover/result:tw-scale-100 desktop-hover:group-hover/result:tw-border-iron-200 desktop-hover:group-hover/result:tw-bg-iron-200"
    : "tw-border-iron-600 tw-bg-iron-900/50 desktop-hover:group-hover/result:tw-border-iron-400";

const getSelectionGlyphStateClassName = ({
  isSelected,
  multichoice,
}: {
  readonly isSelected: boolean;
  readonly multichoice: boolean;
}): string => {
  if (isSelected) {
    return "tw-scale-100 tw-opacity-100";
  }

  return multichoice ? "tw-scale-50 tw-opacity-0" : "tw-scale-0 tw-opacity-0";
};

function PollResultSelectionIndicator({
  isSelected,
  multichoice,
}: {
  readonly isSelected: boolean;
  readonly multichoice: boolean;
}) {
  const indicatorShapeClass = multichoice ? "tw-rounded" : "tw-rounded-full";
  const indicatorStateClass = getSelectionIndicatorStateClassName(isSelected);
  const glyphStateClass = getSelectionGlyphStateClassName({
    isSelected,
    multichoice,
  });

  return (
    <span
      className={`tw-mt-0.5 tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-transition-all tw-duration-300 ${indicatorShapeClass} ${indicatorStateClass}`}
      aria-hidden="true"
    >
      {multichoice ? (
        <CheckIcon
          className={`tw-size-2.5 tw-text-iron-950 tw-transition-all tw-duration-300 ${glyphStateClass}`}
          strokeWidth={3}
        />
      ) : (
        <span
          className={`tw-size-1.5 tw-rounded-full tw-bg-iron-950 tw-transition-all tw-duration-300 ${glyphStateClass}`}
        />
      )}
    </span>
  );
}

function PollResultOptionLabel({
  isSelected,
  optionString,
}: {
  readonly isSelected: boolean;
  readonly optionString: string;
}) {
  const labelClassName = isSelected
    ? "tw-font-medium tw-text-iron-50"
    : "tw-font-medium tw-text-iron-100 desktop-hover:group-hover/result:tw-text-iron-50";

  return (
    <span
      className={`tw-min-w-0 tw-break-words tw-text-[13px] tw-leading-5 tw-transition-colors tw-duration-300 ${labelClassName}`}
    >
      {optionString}
    </span>
  );
}

function PollResultOptionStats({
  animateIn,
  dropId,
  isExpanded,
  isSelected,
  option,
  percentage,
}: {
  readonly animateIn: boolean;
  readonly dropId: string;
  readonly isExpanded: boolean;
  readonly isSelected: boolean;
  readonly option: ApiDropPollOption;
  readonly percentage: number;
}) {
  const statsStateClass = animateIn
    ? "tw-translate-x-0 tw-opacity-100"
    : "tw-translate-x-4 tw-opacity-0";
  const voteCountClassName = isSelected
    ? "tw-text-iron-200"
    : "tw-text-iron-300 desktop-hover:group-hover/result:tw-text-iron-200";
  const percentageClassName = isSelected
    ? "tw-text-iron-100"
    : "tw-text-iron-200 desktop-hover:group-hover/result:tw-text-iron-100";
  const chevronClassName = isExpanded ? "tw-rotate-180" : "";

  return (
    <div
      className={`tw-ml-2 tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2.5 tw-pt-0.5 tw-transition-all tw-duration-500 ${statsStateClass}`}
    >
      {option.votes > 0 && (
        <span className="tw-flex tw-items-center tw-gap-1.5">
          <PollOptionVoterPreviews dropId={dropId} option={option} />
          <span
            className={`tw-text-[11.5px] tw-font-medium tw-transition-colors ${voteCountClassName}`}
          >
            {getVoteCountLabel(option.votes)}
          </span>
        </span>
      )}
      <span
        className={`tw-w-8 tw-text-right tw-text-xs tw-font-bold tw-transition-colors ${percentageClassName}`}
      >
        {percentage}%
      </span>
      <ChevronDownIcon
        className={`tw-size-3.5 tw-flex-shrink-0 tw-text-iron-600 tw-transition-transform tw-duration-200 desktop-hover:group-hover/result:tw-text-iron-400 ${chevronClassName}`}
        aria-hidden="true"
      />
    </div>
  );
}

export function PollResultOption({
  dropId,
  option,
  totalVotes,
  isSelected,
  isDimmed,
  isExpanded,
  multichoice,
  showSelectionIndicator,
  onToggle,
}: PollResultOptionProps) {
  const percentage =
    totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  const fillScale = Math.max(0, Math.min(100, percentage)) / 100;
  const [animateIn, setAnimateIn] = useState(false);
  const prefetchVoters = usePrefetchDropPollOptionVoters();
  const handlePrefetchVoters = () =>
    prefetchVoters({
      dropId,
      optionNo: option.option_no,
      enabled: option.votes > 0,
    });
  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle(option.option_no);
  };
  const buttonClassName = getPollResultButtonClassName({
    isSelected,
    isDimmed,
  });
  const fillClassName = isSelected
    ? "tw-bg-iron-700"
    : "tw-bg-iron-800 desktop-hover:group-hover/result:tw-bg-iron-700";

  useEffect(() => {
    setAnimateIn(false);
    let secondFrame = 0;
    const firstFrame = globalThis.requestAnimationFrame(() => {
      secondFrame = globalThis.requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    });

    return () => {
      globalThis.cancelAnimationFrame(firstFrame);
      globalThis.cancelAnimationFrame(secondFrame);
    };
  }, [fillScale]);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Hide" : "View"} voters for ${
          option.option_string
        }. ${getVoteCountLabel(option.votes)}, ${percentage} percent.`}
        onClick={handleToggle}
        onFocus={handlePrefetchVoters}
        onPointerEnter={handlePrefetchVoters}
        className={buttonClassName}
      >
        <div
          className={`tw-absolute tw-inset-y-0 tw-left-0 tw-w-full tw-origin-left tw-transform-gpu tw-transition-[transform,background-color] tw-duration-700 tw-ease-out ${fillClassName}`}
          style={{ transform: `scaleX(${animateIn ? fillScale : 0})` }}
          aria-hidden="true"
        />
        <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-items-start tw-justify-between tw-gap-3 tw-px-3.5 tw-py-3">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-2.5">
            {showSelectionIndicator && (
              <PollResultSelectionIndicator
                isSelected={isSelected}
                multichoice={multichoice}
              />
            )}
            <PollResultOptionLabel
              isSelected={isSelected}
              optionString={option.option_string}
            />
          </div>
          <PollResultOptionStats
            animateIn={animateIn}
            dropId={dropId}
            isExpanded={isExpanded}
            isSelected={isSelected}
            option={option}
            percentage={percentage}
          />
        </div>
      </button>
    </div>
  );
}
