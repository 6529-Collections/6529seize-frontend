"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BrainLeftSidebarWaveDropTime from "./BrainLeftSidebarWaveDropTime";
import { WaveAvatar } from "../web/WebBrainLeftSidebarWave/subcomponents/WaveAvatar";
import { WaveScoreSummaryHoverCard } from "@/components/waves/WaveTrustSignals";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const SIDEBAR_LOCALE = DEFAULT_LOCALE;
export const HIGHLY_RATED_PREVIEW_MAX_VISIBLE_COUNT = 10 as const;
const PREVIEW_THUMBNAIL_WIDTH_PX = 32;
const PREVIEW_TOUCH_THUMBNAIL_WIDTH_PX = 44;
const PREVIEW_GAP_PX = 6;
const PREVIEW_TOUCH_GAP_PX = 8;

export interface HighlyRatedWavePreviewItem {
  readonly wave: MinimalWave;
  readonly href: string;
  readonly isActive: boolean;
  readonly onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  readonly onMouseEnter?: (() => void) | undefined;
}

type SetActiveWaveForPreview = (
  waveId: string | null,
  options?: {
    readonly isDirectMessage?: boolean | undefined;
    readonly divider?: number | null | undefined;
  }
) => void;

const isDiscoverablePreviewWave = (wave: MinimalWave) =>
  !wave.isPinned && !wave.isFollowing && !wave.isFollowedSubwaveContainer;

export function getHighlyRatedPreviewWaves({
  activeWaveLookupWaves,
  activeParentWaveId,
  activeWaveId,
  highlyRatedWaves,
}: {
  readonly activeWaveLookupWaves: readonly MinimalWave[];
  readonly activeParentWaveId: string | null | undefined;
  readonly activeWaveId: string | null | undefined;
  readonly highlyRatedWaves: readonly MinimalWave[];
}): MinimalWave[] {
  const discoverableHighlyRatedWaves = highlyRatedWaves.filter(
    isDiscoverablePreviewWave
  );
  const highlyRatedWaveIds = new Set(
    discoverableHighlyRatedWaves.map((wave) => wave.id)
  );
  const findRecoverableWave = (waveId: string | null | undefined) => {
    if (typeof waveId !== "string" || highlyRatedWaveIds.has(waveId)) {
      return undefined;
    }

    const activeWave = activeWaveLookupWaves.find((wave) => wave.id === waveId);

    if (activeWave === undefined || !isDiscoverablePreviewWave(activeWave)) {
      return undefined;
    }

    return activeWave;
  };
  const activeWave =
    findRecoverableWave(activeWaveId) ??
    findRecoverableWave(activeParentWaveId);

  if (activeWave === undefined) {
    return discoverableHighlyRatedWaves;
  }

  return [...discoverableHighlyRatedWaves, activeWave];
}

const isModifiedAnchorClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey ||
  event.button === 1 ||
  event.button === 2;

export function buildHighlyRatedWavePreviewItems({
  activeParentWaveId,
  activeWaveId,
  getHref,
  handleHover,
  hasTouchScreen,
  isDirectMessage,
  setActiveWave,
  waves,
}: {
  readonly activeParentWaveId: string | null;
  readonly activeWaveId: string | null;
  readonly getHref: (wave: MinimalWave) => string;
  readonly handleHover: (waveId: string) => void;
  readonly hasTouchScreen: boolean;
  readonly isDirectMessage: boolean;
  readonly setActiveWave: SetActiveWaveForPreview;
  readonly waves: readonly MinimalWave[];
}): HighlyRatedWavePreviewItem[] {
  return waves.map((wave) => ({
    wave,
    href: getHref(wave),
    isActive: activeWaveId === wave.id || activeParentWaveId === wave.id,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || isModifiedAnchorClick(event)) {
        return;
      }

      event.preventDefault();
      handleHover(wave.id);
      const nextWaveId = wave.id === activeWaveId ? null : wave.id;
      setActiveWave(nextWaveId, {
        isDirectMessage,
        divider: nextWaveId === null ? null : wave.firstUnreadDropSerialNo,
      });
    },
    onMouseEnter: hasTouchScreen ? undefined : () => handleHover(wave.id),
  }));
}

const getWaveScoreLabel = (wave: MinimalWave): string | null => {
  const score = wave.waveScore?.visibility_score;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return formatInteger(SIDEBAR_LOCALE, Math.round(score));
};

const getScoreBadgeFontSize = (scoreLabel: string) => {
  if (scoreLabel.length >= 5) {
    return 5.6;
  }

  if (scoreLabel.length === 4) {
    return 6.4;
  }

  if (scoreLabel.length === 3) {
    return 7.4;
  }

  return 9.2;
};

const getLatestDropTimestamp = (wave: MinimalWave): number | null =>
  wave.newDropsCount.latestDropTimestamp !== null &&
  wave.newDropsCount.latestDropTimestamp !== 0 &&
  Number.isFinite(wave.newDropsCount.latestDropTimestamp)
    ? wave.newDropsCount.latestDropTimestamp
    : null;

export const getFittingPreviewCount = ({
  isTouchPreview = false,
  itemCount,
  width,
}: {
  readonly isTouchPreview?: boolean | undefined;
  readonly itemCount: number;
  readonly width: number;
}) => {
  const maxVisibleCount = Math.min(
    itemCount,
    HIGHLY_RATED_PREVIEW_MAX_VISIBLE_COUNT
  );

  if (maxVisibleCount <= 0 || width <= 0) {
    return maxVisibleCount;
  }

  const thumbnailWidth = isTouchPreview
    ? PREVIEW_TOUCH_THUMBNAIL_WIDTH_PX
    : PREVIEW_THUMBNAIL_WIDTH_PX;
  const gap = isTouchPreview ? PREVIEW_TOUCH_GAP_PX : PREVIEW_GAP_PX;
  const fittingCount = Math.floor((width + gap) / (thumbnailWidth + gap));

  return Math.max(1, Math.min(maxVisibleCount, fittingCount));
};

const getMaxPreviewItems = (
  previewItems: readonly HighlyRatedWavePreviewItem[]
) => {
  const cappedPreviewItems = previewItems.slice(
    0,
    HIGHLY_RATED_PREVIEW_MAX_VISIBLE_COUNT
  );
  const activePreviewItem = previewItems.find((item) => item.isActive);

  if (
    activePreviewItem === undefined ||
    cappedPreviewItems.some(
      (item) => item.wave.id === activePreviewItem.wave.id
    )
  ) {
    return cappedPreviewItems;
  }

  return [...cappedPreviewItems.slice(0, -1), activePreviewItem];
};

export const getVisibleHighlyRatedPreviewItems = ({
  previewItems,
  visiblePreviewCount,
}: {
  readonly previewItems: readonly HighlyRatedWavePreviewItem[];
  readonly visiblePreviewCount: number;
}) => {
  const maxPreviewItems = getMaxPreviewItems(previewItems);
  const cappedVisibleCount = Math.min(
    maxPreviewItems.length,
    Math.max(0, visiblePreviewCount)
  );
  const activePreviewIndex = maxPreviewItems.findIndex((item) => item.isActive);

  if (
    activePreviewIndex < cappedVisibleCount ||
    cappedVisibleCount >= maxPreviewItems.length
  ) {
    return maxPreviewItems.slice(0, cappedVisibleCount);
  }

  const activePreviewItem = maxPreviewItems[activePreviewIndex];
  if (activePreviewItem === undefined) {
    return maxPreviewItems.slice(0, cappedVisibleCount);
  }

  return [
    ...maxPreviewItems.slice(0, Math.max(0, cappedVisibleCount - 1)),
    activePreviewItem,
  ];
};

function HighlyRatedWavePreviewScoreBadge({
  isTouchPreview,
  onMouseEnter,
  scoreLabel,
}: {
  readonly isTouchPreview: boolean;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly scoreLabel: string | null;
}) {
  if (scoreLabel === null) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      onMouseEnter={onMouseEnter}
      className={`tw-absolute ${isTouchPreview ? "-tw-bottom-1.5 -tw-right-2" : "-tw-bottom-1 -tw-right-1.5"} tw-z-20 tw-inline-flex tw-h-6 tw-w-7 tw-cursor-help tw-items-center tw-justify-center tw-overflow-visible tw-drop-shadow-[0_5px_9px_rgba(0,0,0,0.50)]`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 26"
        className={`tw-pointer-events-none ${isTouchPreview ? "tw-h-6 tw-w-7" : "tw-h-5 tw-w-6"} tw-overflow-visible`}
      >
        <path
          d="M16 2.15 28 6.15v6.7c0 5.45-4.35 9.5-12 11.2-7.65-1.7-12-5.75-12-11.2v-6.7L16 2.15Z"
          className="tw-fill-iron-800 tw-stroke-iron-950"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M16 4.7 25.35 7.75v5.1c0 4.15-3.2 7.15-9.35 8.75-6.15-1.6-9.35-4.6-9.35-8.75v-5.1L16 4.7Z"
          className="tw-fill-none tw-stroke-white/20"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <text
          x="16"
          y="13.2"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={getScoreBadgeFontSize(scoreLabel)}
          fontWeight="700"
          className="tw-fill-iron-50"
        >
          {scoreLabel}
        </text>
      </svg>
    </span>
  );
}

function HighlyRatedWavePreviewLink({
  isTouchPreview,
  item,
}: {
  readonly isTouchPreview: boolean;
  readonly item: HighlyRatedWavePreviewItem;
}) {
  const { wave } = item;
  const isDropWave = wave.type !== ApiWaveType.Chat;
  const scoreLabel = getWaveScoreLabel(wave);
  const latestDropTimestamp = getLatestDropTimestamp(wave);
  const linkLabel =
    scoreLabel === null
      ? t(
          SIDEBAR_LOCALE,
          "waves.sidebar.highlyRatedPreviewOpenAriaLabel.none",
          {
            waveName: wave.name,
          }
        )
      : t(
          SIDEBAR_LOCALE,
          "waves.sidebar.highlyRatedPreviewOpenAriaLabel.withScore",
          {
            waveName: wave.name,
            score: scoreLabel,
          }
        );
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const shouldKeepClickOnLink =
      event.defaultPrevented || isModifiedAnchorClick(event);
    item.onClick(event);
    if (shouldKeepClickOnLink || event.defaultPrevented) {
      event.stopPropagation();
    }
  };

  return (
    <WaveScoreSummaryHoverCard
      closeOnContentClick
      stopClickPropagation
      summaryHeader={{
        title: wave.name,
        meta:
          latestDropTimestamp === null ? (
            <span>
              {t(SIDEBAR_LOCALE, "waves.score.summary.noMessagesYet")}
            </span>
          ) : (
            <>
              <span>
                {t(SIDEBAR_LOCALE, "waves.score.summary.lastMessage")}
              </span>
              <BrainLeftSidebarWaveDropTime time={latestDropTimestamp} />
            </>
          ),
      }}
      triggerDisplay="inline-flex"
      waveRep={wave.waveRep}
      waveScore={wave.waveScore}
    >
      <span
        className={`tw-relative tw-flex ${isTouchPreview ? "tw-size-11" : "tw-size-8"} tw-flex-shrink-0 tw-items-center tw-justify-center`}
      >
        <Link
          href={item.href}
          prefetch={false}
          aria-label={linkLabel}
          onClick={handleLinkClick}
          {...(item.onMouseEnter ? { onMouseEnter: item.onMouseEnter } : {})}
          className={`tw-group/preview tw-flex ${isTouchPreview ? "tw-size-11" : "tw-size-8"} tw-items-center tw-justify-center tw-rounded-full tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`}
        >
          <WaveAvatar
            dropBadgePlacement="bottom-left"
            isActive={item.isActive}
            isDropWave={isDropWave}
            showNewDropsBadge={false}
            showUnreadDropsBadge={false}
            size={isTouchPreview ? "lg" : "default"}
            wave={wave}
          />
        </Link>
        <HighlyRatedWavePreviewScoreBadge
          isTouchPreview={isTouchPreview}
          onMouseEnter={item.onMouseEnter}
          scoreLabel={scoreLabel}
        />
      </span>
    </WaveScoreSummaryHoverCard>
  );
}

export function HighlyRatedWavesToggle({
  isTouchPreview = false,
  paddingClassName,
  previewItems,
}: {
  readonly isTouchPreview?: boolean | undefined;
  readonly paddingClassName: string;
  readonly previewItems: readonly HighlyRatedWavePreviewItem[];
}) {
  const previewStripRef = useRef<HTMLDivElement>(null);
  const [visiblePreviewCount, setVisiblePreviewCount] = useState<number>(
    HIGHLY_RATED_PREVIEW_MAX_VISIBLE_COUNT
  );
  const activePreviewItemId =
    previewItems.find((item) => item.isActive)?.wave.id ?? null;

  const updateVisiblePreviewCount = useCallback(() => {
    const width = previewStripRef.current?.clientWidth ?? 0;
    setVisiblePreviewCount(
      getFittingPreviewCount({
        isTouchPreview,
        itemCount: previewItems.length,
        width,
      })
    );
  }, [isTouchPreview, previewItems.length]);

  useEffect(() => {
    const previewStrip = previewStripRef.current;
    if (previewStrip === null) {
      return undefined;
    }

    const animationFrameId = globalThis.requestAnimationFrame(
      updateVisiblePreviewCount
    );

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(updateVisiblePreviewCount);
      observer.observe(previewStrip);
      return () => {
        globalThis.cancelAnimationFrame(animationFrameId);
        observer.disconnect();
      };
    }

    globalThis.addEventListener("resize", updateVisiblePreviewCount);
    return () => {
      globalThis.cancelAnimationFrame(animationFrameId);
      globalThis.removeEventListener("resize", updateVisiblePreviewCount);
    };
  }, [activePreviewItemId, updateVisiblePreviewCount]);

  const visiblePreviewItems = useMemo(
    () =>
      getVisibleHighlyRatedPreviewItems({
        previewItems,
        visiblePreviewCount,
      }),
    [previewItems, visiblePreviewCount]
  );

  return (
    <div
      className={`${paddingClassName} ${isTouchPreview ? "tw-pb-3 tw-pt-1" : "tw-pb-1"}`}
    >
      <div
        ref={previewStripRef}
        className={`tw-flex tw-min-w-0 tw-items-center tw-justify-between ${isTouchPreview ? "tw-gap-x-2" : "tw-gap-x-1.5"}`}
      >
        {visiblePreviewItems.map((item) => (
          <HighlyRatedWavePreviewLink
            isTouchPreview={isTouchPreview}
            key={item.wave.id}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
