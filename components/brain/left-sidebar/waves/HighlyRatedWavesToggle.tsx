"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BrainLeftSidebarWaveDropTime from "./BrainLeftSidebarWaveDropTime";
import { WaveAvatar } from "../web/WebBrainLeftSidebarWave/subcomponents/WaveAvatar";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const SIDEBAR_LOCALE = DEFAULT_LOCALE;
export const HIGHLY_RATED_PREVIEW_MAX_VISIBLE_COUNT = 10 as const;
const PREVIEW_THUMBNAIL_WIDTH_PX = 32;
const PREVIEW_GAP_PX = 6;
type PreviewTooltipAlignment = "start" | "center" | "end";
const PREVIEW_TOOLTIP_ALIGNMENT_CLASSNAMES: Record<
  PreviewTooltipAlignment,
  string
> = {
  start: "tw-left-0 tw-translate-x-0",
  center: "tw-left-1/2 -tw-translate-x-1/2",
  end: "tw-right-0 tw-translate-x-0",
};

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

export const getFittingPreviewCount = ({
  itemCount,
  width,
}: {
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

  const fittingCount = Math.floor(
    (width + PREVIEW_GAP_PX) / (PREVIEW_THUMBNAIL_WIDTH_PX + PREVIEW_GAP_PX)
  );

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

export const getHighlyRatedPreviewTooltipAlignment = ({
  index,
  itemCount,
}: {
  readonly index: number;
  readonly itemCount: number;
}): PreviewTooltipAlignment => {
  if (index <= 1) {
    return "start";
  }

  if (itemCount >= 5 && index >= itemCount - 2) {
    return "end";
  }

  return "center";
};

function HighlyRatedWavePreviewScoreBadge({
  scoreLabel,
}: {
  readonly scoreLabel: string | null;
}) {
  if (scoreLabel === null) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 26"
      className="tw-pointer-events-none tw-absolute -tw-bottom-1 -tw-right-1.5 tw-z-10 tw-h-5 tw-w-6 tw-overflow-visible tw-drop-shadow-[0_5px_9px_rgba(0,0,0,0.50)]"
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
  );
}

function HighlyRatedWavePreviewLink({
  item,
  tooltipAlignment,
}: {
  readonly item: HighlyRatedWavePreviewItem;
  readonly tooltipAlignment: PreviewTooltipAlignment;
}) {
  const { wave } = item;
  const isDropWave = wave.type !== ApiWaveType.Chat;
  const scoreLabel = getWaveScoreLabel(wave);
  const latestDropTimestamp =
    wave.newDropsCount.latestDropTimestamp !== null &&
    wave.newDropsCount.latestDropTimestamp !== 0 &&
    Number.isFinite(wave.newDropsCount.latestDropTimestamp)
      ? wave.newDropsCount.latestDropTimestamp
      : null;
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

  return (
    <Link
      href={item.href}
      prefetch={false}
      aria-label={linkLabel}
      onClick={item.onClick}
      {...(item.onMouseEnter ? { onMouseEnter: item.onMouseEnter } : {})}
      className="tw-group/preview tw-relative tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      <WaveAvatar
        dropBadgePlacement="bottom-left"
        isActive={item.isActive}
        isDropWave={isDropWave}
        showNewDropsBadge={false}
        showUnreadDropsBadge={false}
        wave={wave}
      />
      <HighlyRatedWavePreviewScoreBadge scoreLabel={scoreLabel} />
      <span
        className={`tw-pointer-events-none tw-absolute tw-top-10 tw-z-30 tw-hidden tw-w-48 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 tw-py-2 tw-text-left tw-shadow-xl group-hover/preview:tw-block group-focus-visible/preview:tw-block ${PREVIEW_TOOLTIP_ALIGNMENT_CLASSNAMES[tooltipAlignment]}`}
      >
        <span className="tw-block tw-truncate tw-text-xs tw-font-semibold tw-text-iron-100">
          {wave.name}
        </span>
        <span className="tw-mt-1 tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-text-iron-400">
          {latestDropTimestamp !== null && (
            <span className="tw-whitespace-nowrap">
              <BrainLeftSidebarWaveDropTime time={latestDropTimestamp} />
            </span>
          )}
          {scoreLabel !== null && (
            <span className="tw-ml-auto tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
              <svg
                className="tw-size-3 tw-flex-shrink-0 tw-text-iron-400"
                viewBox="0 0 32 26"
                aria-hidden="true"
              >
                <path
                  d="M16 2.4 27.3 6.2v6.65c0 5.25-4.1 9.15-11.3 10.85-7.2-1.7-11.3-5.6-11.3-10.85V6.2L16 2.4Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
              {t(SIDEBAR_LOCALE, "waves.sidebar.highlyRatedPreviewScore", {
                score: scoreLabel,
              })}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function HighlyRatedWavesToggle({
  paddingClassName,
  previewItems,
}: {
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
      getFittingPreviewCount({ itemCount: previewItems.length, width })
    );
  }, [previewItems.length]);

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
    <div className={`${paddingClassName} tw-pb-1`}>
      <div
        ref={previewStripRef}
        className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-1.5"
      >
        {visiblePreviewItems.map((item, index) => (
          <HighlyRatedWavePreviewLink
            key={item.wave.id}
            item={item}
            tooltipAlignment={getHighlyRatedPreviewTooltipAlignment({
              index,
              itemCount: visiblePreviewItems.length,
            })}
          />
        ))}
      </div>
    </div>
  );
}
