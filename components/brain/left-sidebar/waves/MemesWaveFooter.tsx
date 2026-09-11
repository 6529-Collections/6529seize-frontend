"use client";

import MemesWaveQuickVoteTrigger from "@/components/brain/left-sidebar/waves/MemesWaveQuickVoteTrigger";
import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import {
  useMemesWaveFooterStats,
  type MemesWaveFooterStats,
} from "@/hooks/useMemesWaveFooterStats";
import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
} from "@/hooks/memesQuickVote.helpers";
import {
  MEMES_WAVE_FLOATING_FOOTER_DOCK_GAP_PX,
  MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM,
  MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE,
  MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY,
  MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME,
} from "@/components/brain/left-sidebar/waves/MemesWaveFooter.constants";
import { MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS } from "@/helpers/navigation.helpers";
import { PULL_TO_REFRESH_FIXED_OVERLAY_ATTRIBUTE } from "@/helpers/pull-to-refresh.helpers";
import { useMeasuredMobileBottomNavDockBottom } from "@/hooks/useMeasuredMobileBottomNavDockBottom";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import React from "react";

interface MemesWaveFooterProps {
  readonly collapsed?: boolean | undefined;
  readonly floating?: boolean | undefined;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

type MemesWaveFooterViewProps = MemesWaveFooterProps & {
  readonly stats: MemesWaveFooterStats;
};

const revealTransition = {
  duration: 0.22,
  ease: "easeOut",
} as const;

interface MemesWaveFooterLabels {
  readonly buttonAriaLabel: string;
  readonly buttonTitle: string;
  readonly buttonValue: string;
}

const getMemesWaveFooterLabels = ({
  isReady,
  leftThisRoundText,
  locale,
  uncastPower,
  unratedText,
  votingLabel,
}: {
  readonly isReady: boolean;
  readonly leftThisRoundText: string;
  readonly locale: SupportedLocale;
  readonly uncastPower: number | null;
  readonly unratedText: string;
  readonly votingLabel: string | null;
}): MemesWaveFooterLabels => {
  if (!isReady || typeof uncastPower !== "number") {
    return {
      buttonAriaLabel: t(locale, "memes.waveFooter.quickVote.label"),
      buttonTitle: t(locale, "memes.waveFooter.quickVote.label"),
      buttonValue: t(locale, "memes.waveFooter.quickVote.open"),
    };
  }

  const formattedPower = formatInteger(locale, uncastPower);
  const resolvedAriaVotingLabel =
    votingLabel ?? t(locale, "memes.waveFooter.uncastPower.votes");
  const resolvedVisibleVotingLabel =
    votingLabel ?? t(locale, "memes.waveFooter.uncastPower.votesVisible");

  return {
    buttonAriaLabel: t(locale, "memes.waveFooter.uncastPower.ariaLabel", {
      leftThisRound: leftThisRoundText,
      power: formattedPower,
      unrated: unratedText,
      votingLabel: resolvedAriaVotingLabel,
    }),
    buttonTitle: t(locale, "memes.waveFooter.uncastPower.title"),
    buttonValue: t(locale, "memes.waveFooter.uncastPower.visibleValue", {
      power: formattedPower,
      votingLabel: resolvedVisibleVotingLabel,
    }),
  };
};

const getContainerClassName = ({
  collapsed,
  floating,
}: {
  readonly collapsed: boolean;
  readonly floating: boolean;
}): string => {
  if (collapsed) {
    return "tw-z-10 tw-flex tw-flex-shrink-0 tw-justify-center tw-gap-2 tw-px-4 tw-pb-2 tw-pt-1";
  }

  if (floating) {
    return "tw-pointer-events-none tw-fixed tw-inset-x-0 tw-z-40 tw-flex tw-justify-center tw-px-4 tw-will-change-[bottom]";
  }

  return "tw-relative tw-z-20 tw-mt-auto tw-flex-shrink-0";
};

const getExpandedFrameClassName = (floating: boolean): string => {
  if (floating) {
    return `tw-pointer-events-auto ${MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME} tw-origin-bottom tw-scale-[var(--memes-wave-floating-footer-scale)] tw-flex-shrink-0 tw-transform-gpu tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] tw-will-change-transform motion-reduce:tw-transition-none`;
  }

  return "tw-mt-auto tw-w-full tw-flex-shrink-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/60 tw-bg-black tw-p-3";
};

const getContainerStyle = ({
  floating,
}: {
  readonly floating: boolean;
}): NonNullable<React.ComponentProps<typeof m.div>["style"]> => {
  if (!floating) {
    return {};
  }

  return MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE as NonNullable<
    React.ComponentProps<typeof m.div>["style"]
  >;
};

export const MemesWaveFooterView: React.FC<MemesWaveFooterViewProps> = ({
  collapsed = false,
  floating = false,
  onOpenQuickVote,
  onPrefetchQuickVote,
  stats,
}) => {
  const {
    isAvailable,
    isReady,
    leftThisRoundCount,
    uncastPower,
    unratedCount,
    votingLabel,
  } = stats;
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const isCompactAppFooter = floating && isApp;
  const floatingFooterRef = useMeasuredMobileBottomNavDockBottom({
    dockGapPx: MEMES_WAVE_FLOATING_FOOTER_DOCK_GAP_PX,
    enabled: floating,
    fallbackBottom: MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM,
    measurementWindowMs: MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS,
    targetScaleProperty: MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY,
    watchForDockRoot: floating && isApp,
  });
  const leftThisRoundText = formatMemesQuickVoteLeftThisRoundText(
    leftThisRoundCount,
    locale
  );
  const unratedText = formatMemesQuickVoteUnratedText(unratedCount, locale);
  const compactPowerText =
    typeof uncastPower === "number" ? formatInteger(locale, uncastPower) : null;
  const compactVotingLabel =
    votingLabel ?? t(locale, "memes.waveFooter.uncastPower.votesVisible");
  const compactLeftText = t(
    locale,
    "memes.waveFooter.uncastPower.compactLeft",
    { count: formatInteger(locale, leftThisRoundCount) }
  );
  const { buttonAriaLabel, buttonTitle, buttonValue } =
    getMemesWaveFooterLabels({
      isReady,
      leftThisRoundText,
      locale,
      uncastPower,
      unratedText,
      votingLabel,
    });

  const handleOpenQuickVote = () => {
    if (!isAvailable) {
      return;
    }

    onOpenQuickVote();
  };

  const handlePrefetchQuickVote = () => {
    if (!isAvailable) {
      return;
    }

    onPrefetchQuickVote?.();
  };

  const containerClassName = getContainerClassName({ collapsed, floating });
  const expandedFrameClassName = getExpandedFrameClassName(floating);
  const containerStyle = getContainerStyle({ floating });

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isAvailable && (
          <m.div
            ref={floatingFooterRef}
            data-memes-wave-footer-layer={floating ? "floating" : undefined}
            {...(floating
              ? { [PULL_TO_REFRESH_FIXED_OVERLAY_ATTRIBUTE]: "true" }
              : {})}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={revealTransition}
            style={containerStyle}
            className={containerClassName}
          >
            {collapsed ? (
              <MemesWaveQuickVoteTrigger
                isAvailable={isAvailable}
                leftThisRoundCount={leftThisRoundCount}
                locale={locale}
                onOpenQuickVote={handleOpenQuickVote}
                onPrefetchQuickVote={handlePrefetchQuickVote}
                unratedCount={unratedCount}
              />
            ) : (
              <div
                data-memes-wave-footer-frame={floating ? "floating" : undefined}
                className={expandedFrameClassName}
              >
                {isCompactAppFooter ? (
                  <button
                    type="button"
                    aria-label={buttonAriaLabel}
                    onClick={handleOpenQuickVote}
                    onFocus={handlePrefetchQuickVote}
                    onMouseEnter={handlePrefetchQuickVote}
                    onPointerDown={handlePrefetchQuickVote}
                    data-memes-wave-footer-variant="compact-app"
                    className="tw-group tw-flex tw-h-11 tw-w-full tw-min-w-0 tw-cursor-pointer tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0c0d10] tw-px-4 tw-py-0 tw-text-left tw-shadow-lg tw-shadow-black/35 tw-transition-[background-color,border-color] tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400/70 active:tw-bg-[#111319]"
                  >
                    <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                      <MemesWaveZapIcon className="tw-size-4 tw-flex-shrink-0 tw-fill-none tw-text-primary-400" />
                      {compactPowerText === null ? (
                        <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                          {buttonValue}
                        </span>
                      ) : (
                        <span className="tw-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap">
                          <span className="tw-text-sm tw-font-semibold tw-tracking-tight tw-text-iron-100">
                            {compactPowerText}
                          </span>
                          <span className="tw-text-sm tw-font-normal tw-text-iron-500">
                            {compactVotingLabel}
                          </span>
                        </span>
                      )}
                    </span>

                    {isReady && (
                      <span className="tw-ml-auto tw-flex tw-min-w-0 tw-flex-shrink tw-items-center tw-gap-3 tw-pl-3">
                        <span className="tw-truncate tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-primary-300">
                          {compactLeftText}
                        </span>
                        <span
                          aria-hidden="true"
                          className="tw-h-5 tw-w-px tw-flex-shrink-0 tw-bg-white/[0.14]"
                        />
                        <span className="tw-truncate tw-whitespace-nowrap tw-text-[11px] tw-font-normal tw-text-iron-500">
                          {unratedText}
                        </span>
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="tw-flex tw-items-stretch tw-gap-2">
                    <button
                      type="button"
                      aria-label={buttonAriaLabel}
                      onClick={handleOpenQuickVote}
                      onFocus={handlePrefetchQuickVote}
                      onMouseEnter={handlePrefetchQuickVote}
                      onPointerDown={handlePrefetchQuickVote}
                      className="tw-group tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400/70"
                    >
                      <div className="tw-flex tw-h-full tw-items-center tw-justify-between tw-gap-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0c1018] tw-px-3 tw-py-2.5 tw-shadow-sm tw-shadow-black/30 tw-transition-[background-color,border-color] tw-duration-200 desktop-hover:group-hover:tw-border-white/[0.14] desktop-hover:group-hover:tw-bg-[#0f1420]">
                        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
                          <span className="tw-whitespace-nowrap tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
                            {buttonTitle}
                          </span>

                          <div className="tw-flex tw-items-center tw-gap-1.5">
                            <MemesWaveZapIcon className="tw-size-3.5 tw-flex-shrink-0 tw-fill-none tw-text-primary-400" />
                            <span className="tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-iron-100">
                              {buttonValue}
                            </span>
                          </div>
                        </div>

                        {isReady && (
                          <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-end tw-gap-0.5 tw-text-right">
                            <span className="tw-text-xs tw-font-medium tw-text-primary-300">
                              {leftThisRoundText}
                            </span>
                            <span className="tw-text-[11px] tw-font-normal tw-text-iron-500">
                              {unratedText}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

const MemesWaveFooter: React.FC<MemesWaveFooterProps> = (props) => {
  const stats = useMemesWaveFooterStats();

  return <MemesWaveFooterView {...props} stats={stats} />;
};

export default MemesWaveFooter;
