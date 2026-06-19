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

export function getHighlyRatedPreviewWaves({
  activeParentWaveId,
  activeWaveId,
  allWaves,
  highlyRatedWaves,
}: {
  readonly activeParentWaveId: string | null | undefined;
  readonly activeWaveId: string | null | undefined;
  readonly allWaves: readonly MinimalWave[];
  readonly highlyRatedWaves: readonly MinimalWave[];
}): MinimalWave[] {
  const activeIds = [activeWaveId, activeParentWaveId].filter(
    (waveId): waveId is string => typeof waveId === "string"
  );

  if (activeIds.length === 0) {
    return [...highlyRatedWaves];
  }

  const highlyRatedWaveIds = new Set(highlyRatedWaves.map((wave) => wave.id));
  const activeWave = allWaves.find((wave) => activeIds.includes(wave.id));

  if (activeWave === undefined || highlyRatedWaveIds.has(activeWave.id)) {
    return [...highlyRatedWaves];
  }

  return [...highlyRatedWaves, activeWave];
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

const getPluralKey = (count: number) => (count === 1 ? "one" : "other");

const getUnreadCount = (wave: MinimalWave) =>
  Math.max(wave.unreadDropsCount, wave.newDropsCount.count);

const getWaveScoreLabel = (wave: MinimalWave): string | null => {
  const score = wave.waveScore?.visibility_score;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return formatInteger(SIDEBAR_LOCALE, Math.round(score));
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
    cappedPreviewItems.some((item) => item.wave.id === activePreviewItem.wave.id)
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

function HighlyRatedWavePreviewLink({
  item,
}: {
  readonly item: HighlyRatedWavePreviewItem;
}) {
  const { wave } = item;
  const unreadCount = getUnreadCount(wave);
  const countKey = getPluralKey(unreadCount);
  const isDropWave = wave.type !== ApiWaveType.Chat;
  const scoreLabel = getWaveScoreLabel(wave);
  const latestDropTimestamp =
    wave.newDropsCount.latestDropTimestamp !== null &&
    wave.newDropsCount.latestDropTimestamp !== 0 &&
    Number.isFinite(wave.newDropsCount.latestDropTimestamp)
      ? wave.newDropsCount.latestDropTimestamp
      : null;
  const linkLabel =
    unreadCount > 0
      ? t(
          SIDEBAR_LOCALE,
          `waves.sidebar.highlyRatedPreviewOpenAriaLabel.${countKey}`,
          {
            waveName: wave.name,
            count: formatInteger(SIDEBAR_LOCALE, unreadCount),
          }
        )
      : t(
          SIDEBAR_LOCALE,
          "waves.sidebar.highlyRatedPreviewOpenAriaLabel.none",
          {
            waveName: wave.name,
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
        isActive={item.isActive}
        isDropWave={isDropWave}
        showNewDropsBadge={!item.isActive && unreadCount > 0}
        wave={wave}
      />
      <span className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-10 tw-z-30 tw-hidden tw-w-48 -tw-translate-x-1/2 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 tw-py-2 tw-text-left tw-shadow-xl group-hover/preview:tw-block group-focus-visible/preview:tw-block">
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
            <span className="tw-ml-auto tw-whitespace-nowrap">
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
        className="tw-flex tw-min-w-0 tw-items-center tw-justify-start tw-gap-x-1.5"
      >
        {visiblePreviewItems.map((item) => (
          <HighlyRatedWavePreviewLink key={item.wave.id} item={item} />
        ))}
      </div>
    </div>
  );
}
