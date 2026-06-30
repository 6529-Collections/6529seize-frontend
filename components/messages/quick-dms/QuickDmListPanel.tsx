"use client";

import WavePicture from "@/components/waves/WavePicture";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { getMessagesBaseRoute } from "@/helpers/navigation.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { InboxIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type React from "react";
import { QuickDmLoadingRows, QuickDmPanelHeader } from "./QuickDmPanelPieces";
import {
  getFormattedWaveName,
  getQuickDmConversationAriaLabel,
  getQuickDmConversationTimeLabel,
  getQuickDmScoreLabel,
  getUnreadCount,
} from "./QuickDirectMessagesUtils";

const QuickDmEmptyState = ({
  locale,
}: {
  readonly locale: SupportedLocale;
}) => (
  <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-px-6 tw-py-10 tw-text-center">
    <div className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/5 tw-ring-1 tw-ring-white/10">
      <InboxIcon className="tw-size-5 tw-text-iron-300" aria-hidden="true" />
    </div>
    <p className="tw-text-sm tw-font-medium tw-text-iron-100">
      {t(locale, "quickDm.emptyTitle")}
    </p>
  </div>
);

const QuickDmConversationRow = ({
  locale,
  onOpen,
  onHover,
  wave,
}: {
  readonly locale: SupportedLocale;
  readonly onOpen: (waveId: string) => void;
  readonly onHover: (waveId: string) => void;
  readonly wave: MinimalWave;
}) => {
  const unreadCount = getUnreadCount(wave);
  const title = getFormattedWaveName(wave);
  const displayUnreadCount = unreadCount > 99 ? "99+" : `${unreadCount}`;
  const timeLabel = getQuickDmConversationTimeLabel(wave, locale);
  const scoreLabel = getQuickDmScoreLabel(wave, locale);
  const rowAriaLabel = getQuickDmConversationAriaLabel({
    locale,
    scoreLabel,
    timeLabel,
    title,
    unreadCount,
  });

  return (
    <button
      type="button"
      onClick={() => onOpen(wave.id)}
      onFocus={() => onHover(wave.id)}
      onMouseEnter={() => onHover(wave.id)}
      className="tw-group tw-flex tw-w-full tw-appearance-none tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-iron-900/80 tw-px-2 tw-py-2.5 tw-text-left tw-text-inherit tw-ring-1 tw-ring-white/10 tw-transition hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      aria-label={rowAriaLabel}
    >
      <div className="tw-relative tw-size-10 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/15">
        <WavePicture
          name={title}
          picture={wave.picture}
          contributors={wave.contributors}
        />
        {unreadCount > 0 && (
          <span
            className="tw-absolute tw-right-[-6px] tw-top-[-6px] tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-500 tw-px-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-white tw-shadow-sm tw-ring-2 tw-ring-iron-950"
            aria-hidden="true"
          >
            {displayUnreadCount}
          </span>
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-iron-100 group-hover:tw-text-white">
          {title}
        </span>
        <p className="tw-mt-0.5 tw-truncate tw-text-xs tw-text-iron-400">
          {timeLabel}
        </p>
      </div>
      {scoreLabel !== null && (
        <div
          className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1 tw-text-iron-200"
          title={t(locale, "waves.score.summary.scoreAria", {
            visibilityScore: scoreLabel,
          })}
          aria-hidden="true"
        >
          <ShieldCheckIcon
            className="tw-size-4 tw-text-iron-400"
            aria-hidden="true"
          />
          <span className="tw-text-sm tw-font-semibold tw-tabular-nums">
            {scoreLabel}
          </span>
        </div>
      )}
    </button>
  );
};

export const QuickDmListPanel = ({
  isFetching,
  locale,
  onClose,
  onCreateDirectMessage,
  onOpenAll,
  onOpenChat,
  onRegisterWave,
  waves,
}: {
  readonly isFetching: boolean;
  readonly locale: SupportedLocale;
  readonly onClose: () => void;
  readonly onCreateDirectMessage?: (() => void) | undefined;
  readonly onOpenAll: () => void;
  readonly onOpenChat: (waveId: string) => void;
  readonly onRegisterWave: (waveId: string) => void;
  readonly waves: MinimalWave[];
}) => {
  const recentWaves = waves.slice(0, 5);
  let content: React.ReactNode;

  if (isFetching && waves.length === 0) {
    content = <QuickDmLoadingRows locale={locale} />;
  } else if (recentWaves.length > 0) {
    content = (
      <div className="tw-flex tw-flex-col tw-gap-1">
        {recentWaves.map((wave) => (
          <QuickDmConversationRow
            key={wave.id}
            locale={locale}
            wave={wave}
            onOpen={onOpenChat}
            onHover={onRegisterWave}
          />
        ))}
      </div>
    );
  } else {
    content = <QuickDmEmptyState locale={locale} />;
  }

  return (
    <div className="tw-flex tw-max-h-[420px] tw-w-[340px] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
      <QuickDmPanelHeader
        locale={locale}
        title={t(locale, "quickDm.listTitle")}
        onClose={onClose}
        onCreateDirectMessage={onCreateDirectMessage}
      />
      <div className="tw-min-h-0 tw-overflow-y-auto tw-p-2">{content}</div>
      <div className="tw-border-t tw-border-white/10 tw-p-2">
        <Link
          href={getMessagesBaseRoute(false)}
          onClick={onOpenAll}
          className="hover:tw-text-primary-200 tw-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition hover:tw-bg-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "quickDm.showAll")}
        </Link>
      </div>
    </div>
  );
};
