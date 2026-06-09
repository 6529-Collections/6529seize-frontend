"use client";

import type { ApiDropPollOption } from "@/generated/models/ApiDropPollOption";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { getVoteCountLabel } from "./WaveDropPoll.helpers";
import { PollOptionVoterPreviews } from "./PollOptionVoters";

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
}: {
  readonly dropId: string;
  readonly option: ApiDropPollOption;
  readonly totalVotes: number;
  readonly isSelected: boolean;
  readonly isDimmed: boolean;
  readonly isExpanded: boolean;
  readonly multichoice: boolean;
  readonly showSelectionIndicator: boolean;
  readonly onToggle: (optionNo: number) => void;
}) {
  const percentage =
    totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  const fillScale = Math.max(0, Math.min(100, percentage)) / 100;
  const [animateIn, setAnimateIn] = useState(false);
  const indicatorShapeClass = multichoice ? "tw-rounded" : "tw-rounded-full";
  const indicatorStateClass = isSelected
    ? "tw-scale-110 tw-border-iron-50 tw-bg-iron-50 desktop-hover:group-hover/result:tw-scale-100 desktop-hover:group-hover/result:tw-border-iron-200 desktop-hover:group-hover/result:tw-bg-iron-200"
    : "tw-border-iron-600 tw-bg-iron-900/50 desktop-hover:group-hover/result:tw-border-iron-400";

  useEffect(() => {
    setAnimateIn(false);
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
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
        onClick={(event) => {
          event.stopPropagation();
          onToggle(option.option_no);
        }}
        className={`tw-group/result tw-relative tw-flex tw-min-h-11 tw-w-full tw-transform-gpu tw-cursor-pointer tw-items-stretch tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-p-0 tw-text-left tw-outline-none tw-transition-all tw-duration-300 focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 ${
          isSelected
            ? "tw-border-iron-600 tw-bg-iron-800 tw-shadow-[0_0_15px_rgba(245,245,245,0.04)]"
            : "tw-border-iron-700 tw-bg-iron-800/60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/80"
        } ${
          isDimmed
            ? "tw-opacity-80 desktop-hover:hover:tw-opacity-100"
            : "tw-opacity-100"
        }`}
      >
        <div
          className={`tw-absolute tw-inset-y-0 tw-left-0 tw-w-full tw-origin-left tw-transform-gpu tw-transition-[transform,background-color] tw-duration-700 tw-ease-out ${
            isSelected
              ? "tw-bg-iron-700"
              : "tw-bg-iron-800 desktop-hover:group-hover/result:tw-bg-iron-700"
          }`}
          style={{ transform: `scaleX(${animateIn ? fillScale : 0})` }}
          aria-hidden="true"
        />
        <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-items-start tw-justify-between tw-gap-3 tw-px-3.5 tw-py-3">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-2.5">
            {showSelectionIndicator && (
              <span
                className={`tw-mt-0.5 tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-transition-all tw-duration-300 ${indicatorShapeClass} ${indicatorStateClass}`}
                aria-hidden="true"
              >
                {multichoice ? (
                  <CheckIcon
                    className={`tw-size-2.5 tw-text-iron-950 tw-transition-all tw-duration-300 ${
                      isSelected
                        ? "tw-scale-100 tw-opacity-100"
                        : "tw-scale-50 tw-opacity-0"
                    }`}
                    strokeWidth={3}
                  />
                ) : (
                  <span
                    className={`tw-size-1.5 tw-rounded-full tw-bg-iron-950 tw-transition-all tw-duration-300 ${
                      isSelected
                        ? "tw-scale-100 tw-opacity-100"
                        : "tw-scale-0 tw-opacity-0"
                    }`}
                  />
                )}
              </span>
            )}
            <span
              className={`tw-min-w-0 tw-break-words tw-text-[13px] tw-leading-5 tw-transition-colors tw-duration-300 ${
                isSelected
                  ? "tw-font-medium tw-text-iron-50"
                  : "tw-font-medium tw-text-iron-100 desktop-hover:group-hover/result:tw-text-iron-50"
              }`}
            >
              {option.option_string}
            </span>
          </div>
          <div
            className={`tw-ml-2 tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2.5 tw-pt-0.5 tw-transition-all tw-duration-500 ${
              animateIn
                ? "tw-translate-x-0 tw-opacity-100"
                : "tw-translate-x-4 tw-opacity-0"
            }`}
          >
            {option.votes > 0 && (
              <span className="tw-flex tw-items-center tw-gap-1.5">
                <PollOptionVoterPreviews dropId={dropId} option={option} />
                <span
                  className={`tw-text-[11.5px] tw-font-medium tw-transition-colors ${
                    isSelected
                      ? "tw-text-iron-200"
                      : "tw-text-iron-300 desktop-hover:group-hover/result:tw-text-iron-200"
                  }`}
                >
                  {getVoteCountLabel(option.votes)}
                </span>
              </span>
            )}
            <span
              className={`tw-w-8 tw-text-right tw-text-xs tw-font-bold tw-transition-colors ${
                isSelected
                  ? "tw-text-iron-100"
                  : "tw-text-iron-200 desktop-hover:group-hover/result:tw-text-iron-100"
              }`}
            >
              {percentage}%
            </span>
            <ChevronDownIcon
              className={`tw-size-3.5 tw-flex-shrink-0 tw-text-iron-600 tw-transition-transform tw-duration-200 desktop-hover:group-hover/result:tw-text-iron-400 ${
                isExpanded ? "tw-rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>
    </div>
  );
}
