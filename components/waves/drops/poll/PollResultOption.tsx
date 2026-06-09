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
  const indicatorShapeClass = multichoice
    ? "tw-rounded-[5px]"
    : "tw-rounded-full";
  const indicatorStateClass = isSelected
    ? "tw-scale-110 tw-border-white tw-bg-white"
    : "tw-border-white/20 tw-bg-black/40";

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
    <div className="tw-overflow-hidden tw-rounded-xl">
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
        className={`tw-group/result tw-relative tw-flex tw-min-h-11 tw-w-full tw-transform-gpu tw-cursor-pointer tw-items-stretch tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-p-0 tw-text-left tw-outline-none tw-transition-all tw-duration-300 focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 ${
          isSelected
            ? "tw-border-white/20 tw-bg-white/[0.06] desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.06]"
            : "tw-border-white/[0.06] tw-bg-white/[0.025] desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-white/[0.05]"
        } ${
          isDimmed
            ? "tw-opacity-60 desktop-hover:hover:tw-opacity-100"
            : "tw-opacity-100"
        }`}
      >
        <div
          className={`tw-absolute tw-inset-y-0 tw-left-0 tw-w-full tw-origin-left tw-transform-gpu tw-transition-[transform,background-color] tw-duration-700 tw-ease-out ${
            isSelected
              ? "tw-bg-white/[0.12]"
              : "tw-bg-white/[0.05] desktop-hover:group-hover/result:tw-bg-white/[0.08]"
          }`}
          style={{ transform: `scaleX(${animateIn ? fillScale : 0})` }}
          aria-hidden="true"
        />
        <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-items-start tw-justify-between tw-gap-3 tw-px-4 tw-py-3">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-3">
            {showSelectionIndicator && (
              <span
                className={`tw-mt-0.5 tw-flex tw-size-[18px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-shadow-sm tw-transition-all tw-duration-300 ${indicatorShapeClass} ${indicatorStateClass}`}
                aria-hidden="true"
              >
                {multichoice ? (
                  <CheckIcon
                    className={`tw-size-3 tw-text-black tw-transition-all tw-duration-300 ${
                      isSelected
                        ? "tw-scale-100 tw-opacity-100"
                        : "tw-scale-50 tw-opacity-0"
                    }`}
                    strokeWidth={3}
                  />
                ) : (
                  <span
                    className={`tw-size-[7px] tw-rounded-full tw-bg-black tw-transition-all tw-duration-300 ${
                      isSelected
                        ? "tw-scale-100 tw-opacity-100"
                        : "tw-scale-0 tw-opacity-0"
                    }`}
                  />
                )}
              </span>
            )}
            <span
              className={`tw-min-w-0 tw-break-words tw-text-sm tw-leading-5 tw-transition-colors tw-duration-300 ${
                isSelected
                  ? "tw-font-semibold tw-text-white"
                  : "tw-font-medium tw-text-iron-300 desktop-hover:group-hover/result:tw-text-iron-100"
              }`}
            >
              {option.option_string}
            </span>
          </div>
          <div
            className={`tw-ml-2 tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3 tw-pt-0.5 tw-transition-all tw-duration-500 ${
              animateIn
                ? "tw-translate-x-0 tw-opacity-100"
                : "tw-translate-x-4 tw-opacity-0"
            }`}
          >
            {option.votes > 0 && (
              <span className="tw-flex tw-items-center tw-gap-1.5">
                <PollOptionVoterPreviews dropId={dropId} option={option} />
                <span className="tw-text-xs tw-font-medium tw-text-white/40 tw-transition-colors desktop-hover:group-hover/result:tw-text-white/70">
                  {getVoteCountLabel(option.votes)}
                </span>
              </span>
            )}
            <span
              className={`tw-w-8 tw-text-right tw-text-[13.5px] tw-font-semibold ${
                isSelected ? "tw-text-white/75" : "tw-text-white/45"
              }`}
            >
              {percentage}%
            </span>
            <ChevronDownIcon
              className={`tw-size-3.5 tw-flex-shrink-0 tw-text-white/35 tw-transition-transform tw-duration-200 desktop-hover:group-hover/result:tw-text-white/70 ${
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
