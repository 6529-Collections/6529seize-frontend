"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import { BoltIcon } from "@heroicons/react/24/solid";
import React from "react";

interface MemesWaveQuickVoteTriggerProps {
  readonly className?: string | undefined;
  readonly onOpenQuickVote: () => void;
  readonly unratedCount: number;
}

const MemesWaveQuickVoteTrigger: React.FC<MemesWaveQuickVoteTriggerProps> = ({
  className,
  onOpenQuickVote,
  unratedCount,
}) => {
  if (unratedCount <= 0) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={`${unratedCount} submissions left unrated in memes wave`}
      title={`${unratedCount} left`}
      onClick={onOpenQuickVote}
      className={`tw-flex tw-items-center tw-gap-x-1.5 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-px-2.5 tw-py-2 tw-text-primary-300 tw-shadow-[0_12px_24px_rgba(11,93,255,0.2)] tw-transition-colors tw-duration-300 desktop-hover:hover:tw-border-primary-400/40 desktop-hover:hover:tw-bg-primary-500/15 ${
        className ?? ""
      }`}
    >
      <BoltIcon className="tw-size-4 tw-flex-shrink-0" />
      <span className="tw-text-xs tw-font-semibold">
        {formatNumberWithCommas(unratedCount)}
      </span>
    </button>
  );
};

export default MemesWaveQuickVoteTrigger;
