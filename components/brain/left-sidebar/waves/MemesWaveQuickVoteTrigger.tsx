"use client";

import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
} from "@/hooks/memesQuickVote.helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import React from "react";

interface MemesWaveQuickVoteTriggerProps {
  readonly isAvailable?: boolean | undefined;
  readonly className?: string | undefined;
  readonly leftThisRoundCount: number;
  readonly locale?: SupportedLocale | undefined;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
  readonly unratedCount: number;
}

const MemesWaveQuickVoteTrigger: React.FC<MemesWaveQuickVoteTriggerProps> = ({
  isAvailable = true,
  className,
  leftThisRoundCount,
  locale = DEFAULT_LOCALE,
  onOpenQuickVote,
  onPrefetchQuickVote,
  unratedCount,
}) => {
  if (!isAvailable) {
    return null;
  }

  const leftThisRoundText = formatMemesQuickVoteLeftThisRoundText(
    leftThisRoundCount,
    locale
  );
  const unratedText = formatMemesQuickVoteUnratedText(unratedCount, locale);
  const summaryLabel = t(locale, "memes.quickVote.summary", {
    leftThisRound: leftThisRoundText,
    unrated: unratedText,
  });
  const label =
    leftThisRoundCount > 0
      ? t(locale, "memes.quickVote.inMemesWave", {
          leftThisRound: leftThisRoundText,
          unrated: unratedText,
        })
      : t(locale, "memes.waveFooter.quickVote.label");
  const title =
    leftThisRoundCount > 0
      ? summaryLabel
      : t(locale, "memes.waveFooter.quickVote.label");

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={onOpenQuickVote}
      onFocus={onPrefetchQuickVote}
      onMouseEnter={onPrefetchQuickVote}
      onPointerDown={onPrefetchQuickVote}
      className={`tw-flex tw-w-14 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-x-0.5 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-px-0.5 tw-py-2 tw-text-primary-300 tw-shadow-[0_12px_24px_rgba(11,93,255,0.2)] tw-transition-colors tw-duration-300 desktop-hover:hover:tw-border-primary-400/40 desktop-hover:hover:tw-bg-primary-500/15 ${
        className ?? ""
      }`}
    >
      <MemesWaveZapIcon className="tw-size-4 tw-flex-shrink-0 tw-fill-primary-300/20" />
      {leftThisRoundCount > 0 && (
        <span className="tw-text-xs tw-font-semibold">
          {formatInteger(locale, leftThisRoundCount)}
        </span>
      )}
    </button>
  );
};

export default MemesWaveQuickVoteTrigger;
