"use client";

import WavePicture from "@/components/waves/WavePicture";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { InboxIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import type React from "react";
import { useRef } from "react";
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
  <div className="tw-flex tw-min-h-full tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-8 tw-py-12 tw-text-center">
    <div className="tw-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-iron-800">
      <InboxIcon className="tw-size-5 tw-text-iron-300" aria-hidden="true" />
    </div>
    <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
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
      className="tw-group tw-flex tw-w-full tw-appearance-none tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-3 tw-text-left tw-text-inherit tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-900 motion-reduce:tw-transition-none"
      aria-label={rowAriaLabel}
    >
      <div className="tw-relative tw-size-10 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/15">
        <WavePicture
          name={title}
          picture={wave.picture}
          contributors={wave.contributors}
        />
        {unreadCount > 0 && (
          <span
            className="tw-absolute -tw-right-0.5 -tw-top-0.5 tw-flex tw-h-4 tw-min-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-600 tw-px-1 tw-text-[10px] tw-font-medium tw-leading-none tw-text-white tw-shadow-sm tw-ring-1 tw-ring-iron-950"
            aria-hidden="true"
          >
            {displayUnreadCount}
          </span>
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100 desktop-hover:group-hover:tw-text-white">
          {title}
        </span>
        <p className="tw-m-0 tw-mt-0.5 tw-truncate tw-text-xs tw-font-medium tw-text-iron-500 desktop-hover:group-hover:tw-text-iron-400">
          {timeLabel}
        </p>
      </div>
      {scoreLabel !== null && (
        <div
          className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1 tw-text-[#e2e8f0]/[0.85] tw-transition-colors tw-duration-150 desktop-hover:group-hover:tw-text-[#e2e8f0]/[0.95] motion-reduce:tw-transition-none"
          title={t(locale, "waves.score.summary.scoreAria", {
            visibilityScore: scoreLabel,
          })}
          aria-hidden="true"
        >
          <ShieldCheckIcon
            className="tw-size-3.5 tw-opacity-[0.64]"
            aria-hidden="true"
          />
          <span className="tw-text-xs tw-font-medium tw-tabular-nums">
            {scoreLabel}
          </span>
        </div>
      )}
    </button>
  );
};

export const QuickDmListPanel = ({
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  locale,
  onClose,
  onCreateDirectMessage,
  onFetchNextPage,
  onOpenChat,
  onRegisterWave,
  waves,
}: {
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly locale: SupportedLocale;
  readonly onClose: () => void;
  readonly onCreateDirectMessage?: (() => void) | undefined;
  readonly onFetchNextPage: () => void;
  readonly onOpenChat: (waveId: string) => void;
  readonly onRegisterWave: (waveId: string) => void;
  readonly waves: MinimalWave[];
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  let content: React.ReactNode;

  useInfiniteScroll(
    hasNextPage,
    isFetchingNextPage,
    onFetchNextPage,
    scrollContainerRef,
    sentinelRef,
    "80px"
  );

  if (isFetching && waves.length === 0) {
    content = <QuickDmLoadingRows locale={locale} />;
  } else if (waves.length > 0) {
    content = (
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        {waves.map((wave) => (
          <QuickDmConversationRow
            key={wave.id}
            locale={locale}
            wave={wave}
            onOpen={onOpenChat}
            onHover={onRegisterWave}
          />
        ))}
        {(hasNextPage || isFetchingNextPage) && (
          <div
            ref={sentinelRef}
            className="tw-flex tw-h-8 tw-items-center tw-justify-center"
            aria-hidden={!isFetchingNextPage}
          >
            {isFetchingNextPage && (
              <>
                <span className="tw-sr-only" role="status" aria-live="polite">
                  {t(locale, "quickDm.loadingStatus")}
                </span>
                <span
                  className="tw-h-1.5 tw-w-14 tw-animate-pulse tw-rounded-full tw-bg-white/10 motion-reduce:tw-animate-none"
                  aria-hidden="true"
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  } else {
    content = <QuickDmEmptyState locale={locale} />;
  }

  return (
    <div className="tw-flex tw-h-[560px] tw-max-h-[calc(100dvh-8rem)] tw-w-[380px] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <QuickDmPanelHeader
        locale={locale}
        title={t(locale, "quickDm.listTitle")}
        onClose={onClose}
        onCreateDirectMessage={onCreateDirectMessage}
      />
      <div
        ref={scrollContainerRef}
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-2 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-600"
      >
        {content}
      </div>
    </div>
  );
};
