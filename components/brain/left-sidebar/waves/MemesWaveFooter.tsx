"use client";

import MemesWaveQuickVoteTrigger from "@/components/brain/left-sidebar/waves/MemesWaveQuickVoteTrigger";
import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
} from "@/hooks/memesQuickVote.helpers";
import {
  getMemesWaveFloatingFooterMeasuredBottomStyle,
  MEMES_WAVE_FLOATING_FOOTER_DOCK_GAP_PX,
  MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE,
  MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME,
} from "@/components/brain/left-sidebar/waves/MemesWaveFooter.constants";
import { MOBILE_BOTTOM_NAV_DOCK_SELECTOR } from "@/helpers/navigation.helpers";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";

interface MemesWaveFooterProps {
  readonly collapsed?: boolean | undefined;
  readonly floating?: boolean | undefined;
  readonly onAvailabilityChange?: ((isAvailable: boolean) => void) | undefined;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

const revealTransition = {
  duration: 0.22,
  ease: "easeOut",
} as const;

const DOCK_TRANSITION_MEASUREMENT_WINDOW_MS = 420;

const getViewportHeight = (): number => {
  const viewportHeight = globalThis.visualViewport?.height;
  if (typeof viewportHeight === "number" && viewportHeight > 0) {
    return viewportHeight;
  }

  if (
    typeof globalThis.innerHeight === "number" &&
    globalThis.innerHeight > 0
  ) {
    return globalThis.innerHeight;
  }

  return globalThis.document?.documentElement?.clientHeight ?? 0;
};

const getMeasuredDockBottom = (dockElement: HTMLElement): string | null => {
  const rect = dockElement.getBoundingClientRect();
  const viewportHeight = getViewportHeight();

  if (
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.height) ||
    rect.height <= 0 ||
    viewportHeight <= 0
  ) {
    return null;
  }

  const bottom = Math.max(
    0,
    viewportHeight - rect.top + MEMES_WAVE_FLOATING_FOOTER_DOCK_GAP_PX
  );

  return `${Math.round(bottom)}px`;
};

const useMeasuredMobileDockFooterBottom = (enabled: boolean): string | null => {
  const [measuredBottom, setMeasuredBottom] = useState<string | null>(null);
  const commitMeasuredBottom = useCallback((nextBottom: string | null) => {
    setMeasuredBottom((currentBottom) =>
      currentBottom === nextBottom ? currentBottom : nextBottom
    );
  }, []);

  useEffect(() => {
    if (!enabled || typeof globalThis.document === "undefined") {
      commitMeasuredBottom(null);
      return;
    }

    let dockElement = globalThis.document.querySelector<HTMLElement>(
      MOBILE_BOTTOM_NAV_DOCK_SELECTOR
    );
    let animationFrameId: number | null = null;
    let transitionTrackingUntil = 0;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    const updateMeasuredBottom = () => {
      if (cancelled) {
        return;
      }

      dockElement =
        dockElement ??
        globalThis.document.querySelector<HTMLElement>(
          MOBILE_BOTTOM_NAV_DOCK_SELECTOR
        );

      if (!dockElement) {
        commitMeasuredBottom(null);
        return;
      }

      const nextBottom = getMeasuredDockBottom(dockElement);
      commitMeasuredBottom(nextBottom);
    };

    const scheduleMeasurement = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = globalThis.requestAnimationFrame(() => {
        animationFrameId = null;
        updateMeasuredBottom();
      });
    };

    const trackDockTransition = () => {
      transitionTrackingUntil =
        globalThis.performance.now() + DOCK_TRANSITION_MEASUREMENT_WINDOW_MS;

      const tick = () => {
        animationFrameId = null;
        updateMeasuredBottom();

        if (
          !cancelled &&
          globalThis.performance.now() < transitionTrackingUntil
        ) {
          animationFrameId = globalThis.requestAnimationFrame(tick);
        }
      };

      if (animationFrameId === null) {
        animationFrameId = globalThis.requestAnimationFrame(tick);
      }
    };

    updateMeasuredBottom();

    if (typeof ResizeObserver !== "undefined" && dockElement) {
      resizeObserver = new ResizeObserver(trackDockTransition);
      resizeObserver.observe(dockElement);
    }

    dockElement?.addEventListener("transitionrun", trackDockTransition);
    dockElement?.addEventListener("transitionstart", trackDockTransition);
    dockElement?.addEventListener("transitionend", updateMeasuredBottom);
    globalThis.addEventListener("resize", trackDockTransition, {
      passive: true,
    });
    globalThis.visualViewport?.addEventListener("resize", trackDockTransition, {
      passive: true,
    });
    globalThis.document.addEventListener("scroll", trackDockTransition, {
      capture: true,
      passive: true,
    });
    scheduleMeasurement();

    return () => {
      cancelled = true;
      if (animationFrameId !== null) {
        globalThis.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      dockElement?.removeEventListener("transitionrun", trackDockTransition);
      dockElement?.removeEventListener("transitionstart", trackDockTransition);
      dockElement?.removeEventListener("transitionend", updateMeasuredBottom);
      globalThis.removeEventListener("resize", trackDockTransition);
      globalThis.visualViewport?.removeEventListener(
        "resize",
        trackDockTransition
      );
      globalThis.document.removeEventListener("scroll", trackDockTransition, {
        capture: true,
      });
    };
  }, [commitMeasuredBottom, enabled]);

  return measuredBottom;
};

const MemesWaveFooter: React.FC<MemesWaveFooterProps> = ({
  collapsed = false,
  floating = false,
  onAvailabilityChange,
  onOpenQuickVote,
  onPrefetchQuickVote,
}) => {
  const {
    isAvailable,
    isReady,
    leftThisRoundCount,
    uncastPower,
    unratedCount,
    votingLabel,
  } = useMemesWaveFooterStats();
  const measuredDockBottom = useMeasuredMobileDockFooterBottom(floating);
  const buttonAriaLabel =
    isReady && typeof uncastPower === "number"
      ? `Uncast Power, ${formatNumberWithCommas(uncastPower)} ${
          votingLabel ?? "Votes"
        } left, ${formatMemesQuickVoteLeftThisRoundText(
          leftThisRoundCount
        )}, ${formatMemesQuickVoteUnratedText(unratedCount)}`
      : "Quick vote";
  const buttonTitle = isReady ? "Uncast Power" : "Quick vote";
  const votingPowerLabel = votingLabel ? ` ${votingLabel}` : " votes";
  const buttonValue =
    isReady && typeof uncastPower === "number"
      ? `${formatNumberWithCommas(uncastPower)}${votingPowerLabel}`
      : "Open quick vote";

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

  useEffect(() => {
    onAvailabilityChange?.(isAvailable);
  }, [isAvailable, onAvailabilityChange]);

  useEffect(
    () => () => {
      onAvailabilityChange?.(false);
    },
    [onAvailabilityChange]
  );

  const containerClassName = collapsed
    ? "tw-z-10 tw-flex tw-flex-shrink-0 tw-justify-center tw-gap-2 tw-px-4 tw-pb-2 tw-pt-1"
    : floating
      ? "tw-pointer-events-none tw-fixed tw-inset-x-0 tw-z-40 tw-flex tw-justify-center tw-px-4 tw-transition-[bottom] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none"
      : "tw-relative tw-z-20 tw-mt-auto tw-flex-shrink-0";
  const expandedFrameClassName = floating
    ? `tw-pointer-events-auto ${MEMES_WAVE_FLOATING_FOOTER_WIDTH_CLASS_NAME} tw-flex-shrink-0`
    : "tw-mt-auto tw-w-full tw-flex-shrink-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/60 tw-bg-black tw-p-4";
  const containerStyle = (
    floating
      ? measuredDockBottom
        ? getMemesWaveFloatingFooterMeasuredBottomStyle(measuredDockBottom)
        : MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE
      : {}
  ) as NonNullable<React.ComponentProps<typeof motion.div>["style"]>;

  return (
    <AnimatePresence>
      {isAvailable && (
        <motion.div
          data-memes-wave-footer-layer={floating ? "floating" : undefined}
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
              onOpenQuickVote={handleOpenQuickVote}
              onPrefetchQuickVote={handlePrefetchQuickVote}
              unratedCount={unratedCount}
            />
          ) : (
            <div
              data-memes-wave-footer-frame={floating ? "floating" : undefined}
              className={expandedFrameClassName}
            >
              <div className="tw-flex tw-items-stretch tw-gap-2">
                <button
                  type="button"
                  aria-label={buttonAriaLabel}
                  onClick={handleOpenQuickVote}
                  onFocus={handlePrefetchQuickVote}
                  onMouseEnter={handlePrefetchQuickVote}
                  className="tw-group tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
                >
                  <div className="tw-relative tw-flex tw-h-full tw-items-center tw-justify-between tw-gap-4 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#2d3753] tw-bg-[#0c1018] tw-px-4 tw-py-2.5 tw-shadow-lg tw-transition-all tw-duration-200 desktop-hover:group-hover:tw-border-[#3a4670] desktop-hover:group-hover:tw-bg-[#0f1420]">
                    <span
                      aria-hidden="true"
                      className="tw-pointer-events-none tw-absolute tw-inset-0 -tw-translate-x-full tw-bg-gradient-to-r tw-from-white/0 tw-via-white/[0.08] tw-to-white/0 tw-opacity-50 tw-transition-transform tw-duration-1000 tw-ease-out desktop-hover:group-hover:tw-translate-x-full"
                    />
                    <div className="tw-relative tw-z-10 tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
                      <span className="tw-whitespace-nowrap tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-400">
                        {buttonTitle}
                      </span>

                      <div className="tw-flex tw-items-center tw-gap-2">
                        <MemesWaveZapIcon className="tw-size-4 tw-flex-shrink-0 tw-fill-primary-400/20 tw-text-primary-400" />
                        <span className="tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white">
                          {buttonValue}
                        </span>
                      </div>
                    </div>

                    {isReady && (
                      <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-items-end tw-gap-0.5 tw-text-right">
                        <span className="tw-text-xs tw-font-semibold tw-text-[#8199ea] tw-shadow-sm">
                          {formatMemesQuickVoteLeftThisRoundText(
                            leftThisRoundCount
                          )}
                        </span>
                        <span className="tw-text-[11px] tw-font-medium tw-text-iron-400">
                          {formatMemesQuickVoteUnratedText(unratedCount)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemesWaveFooter;
