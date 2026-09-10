"use client";

import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import {
  buildProcessedContent,
  type ProcessedContent,
} from "@/components/waves/drops/media-utils";
import { getRandomColorWithSeed, getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SidebarWave } from "@/types/waves.types";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ArrowUpRightIcon,
  ClockIcon,
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type ExploreWaveCardVariant = "default" | "discover";

interface ExploreWaveCardProps {
  readonly wave: SidebarWave;
  readonly variant?: ExploreWaveCardVariant | undefined;
}

interface ExploreWaveMetric {
  readonly label: string;
  readonly ariaLabel: string;
  readonly iconToneClasses: string;
  readonly icon: ReactNode;
  readonly value: string;
}

const EXPLORE_WAVE_CARD_LOCALE = DEFAULT_LOCALE;
const METRIC_CHIP_CLASSES =
  "tw-inline-flex tw-cursor-help tw-items-center tw-whitespace-nowrap tw-font-medium tw-leading-none";
const METRIC_ICON_CLASSES = "tw-size-3 tw-flex-shrink-0";
const METRIC_VALUE_CLASSES = "tw-text-[11px] tw-font-medium tw-text-iron-500";
const METRIC_SEPARATOR_CLASSES =
  "tw-text-[11px] tw-leading-none tw-text-iron-600";

const getDropsCountMessageKey = (
  count: number,
  includeAgo: boolean
):
  | "waves.explore.card.dropsCount.one"
  | "waves.explore.card.dropsCount.other"
  | "waves.explore.card.dropsCountAgo.one"
  | "waves.explore.card.dropsCountAgo.other" => {
  const pluralCategory = new Intl.PluralRules(EXPLORE_WAVE_CARD_LOCALE).select(
    count
  );

  if (includeAgo) {
    return pluralCategory === "one"
      ? "waves.explore.card.dropsCountAgo.one"
      : "waves.explore.card.dropsCountAgo.other";
  }

  return pluralCategory === "one"
    ? "waves.explore.card.dropsCount.one"
    : "waves.explore.card.dropsCount.other";
};

const formatCompactNumber = (value: number): string =>
  formatNumber(EXPLORE_WAVE_CARD_LOCALE, value, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

const formatScore = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return formatInteger(EXPLORE_WAVE_CARD_LOCALE, Math.round(value));
};

const formatRep = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  if (value > 0) {
    return `+${formatCompactNumber(value)}`;
  }

  return formatCompactNumber(value);
};

const formatRepAccessibleValue = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const formatted = formatInteger(EXPLORE_WAVE_CARD_LOCALE, Math.abs(value));
  if (value > 0) {
    return t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repPositive", {
      value: formatted,
    });
  }
  if (value < 0) {
    return t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repNegative", {
      value: formatted,
    });
  }
  return t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repNeutral", {
    value: formatted,
  });
};

const getVisibilityToneClasses = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "tw-text-iron-400";
  }

  if (value >= 85) {
    return "tw-text-emerald-400";
  }

  if (value >= 65) {
    return "tw-text-sky-400";
  }

  if (value < 35) {
    return "tw-text-rose-400";
  }

  return "tw-text-iron-400";
};

const getRepToneClasses = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return "tw-text-iron-400";
  }

  return value > 0 ? "tw-text-emerald-400" : "tw-text-rose-400";
};

const getRepAriaLabel = (wave: SidebarWave, repScore: string): string => {
  const repAccessibleValue = formatRepAccessibleValue(wave.waveRep?.total_rep);

  if (repAccessibleValue !== null) {
    return t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repAriaRaw", {
      value: repAccessibleValue,
    });
  }

  return t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repAriaScore", {
    repScore,
  });
};

const getExploreWaveMetrics = (wave: SidebarWave): ExploreWaveMetric[] => {
  const visibilityScore = formatScore(wave.waveScore?.visibility_score);
  const hotnessScore = formatScore(wave.waveScore?.hotness_score);
  const repScore =
    wave.waveRep === null
      ? formatScore(wave.waveScore?.rep_sort_score)
      : formatRep(wave.waveRep.total_rep);
  const metrics: ExploreWaveMetric[] = [];

  if (visibilityScore !== null) {
    metrics.push({
      label: t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.scoreLabel"),
      ariaLabel: t(
        EXPLORE_WAVE_CARD_LOCALE,
        "waves.score.details.visibilityAria",
        { visibilityScore }
      ),
      icon: (
        <ShieldCheckIcon
          className={METRIC_ICON_CLASSES}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ),
      iconToneClasses: getVisibilityToneClasses(
        wave.waveScore?.visibility_score
      ),
      value: visibilityScore,
    });
  }

  if (hotnessScore !== null) {
    metrics.push({
      label: t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.hotLabel"),
      ariaLabel: t(
        EXPLORE_WAVE_CARD_LOCALE,
        "waves.score.details.hotnessAria",
        { hotnessScore }
      ),
      icon: (
        <FireIcon
          className={METRIC_ICON_CLASSES}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ),
      iconToneClasses: "tw-text-amber-400",
      value: hotnessScore,
    });
  }

  if (repScore !== null) {
    metrics.push({
      label: t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repLabel"),
      ariaLabel: getRepAriaLabel(wave, repScore),
      icon: (
        <ScaleIcon
          className={METRIC_ICON_CLASSES}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ),
      iconToneClasses: getRepToneClasses(wave.waveRep?.total_rep),
      value: repScore,
    });
  }

  return metrics;
};

const getMetricsSummaryLabel = (
  metrics: readonly ExploreWaveMetric[]
): string | null => {
  if (metrics.length === 0) {
    return null;
  }

  return metrics.map((metric) => metric.ariaLabel).join(". ");
};

export function ExploreWaveCard({
  wave,
  variant = "default",
}: ExploreWaveCardProps) {
  const isDiscover = variant === "discover";
  const waveHref = getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.isDirectMessage,
    isApp: false,
  });

  const banner1 = getRandomColorWithSeed(wave.id);
  const banner2 = getRandomColorWithSeed(wave.name);
  const imageAreaStyle = !wave.picture
    ? {
        background: `linear-gradient(135deg, ${banner1} 0%, ${banner2} 100%)`,
      }
    : undefined;

  const lastMessageTime = wave.latestDropTimestamp;
  const hasDrops = lastMessageTime !== null;
  const descriptionPreview = getWavePreviewContent(wave);
  const formattedDropsCount = formatInteger(
    EXPLORE_WAVE_CARD_LOCALE,
    wave.totalDropsCount
  );
  const timeAgoLabel = hasDrops ? getTimeAgoShort(lastMessageTime) : "";
  const shouldAppendAgo = isDiscover && /^\d+[hm]$/.test(timeAgoLabel);
  const dropsCountLabel = hasDrops
    ? t(
        EXPLORE_WAVE_CARD_LOCALE,
        getDropsCountMessageKey(wave.totalDropsCount, shouldAppendAgo),
        {
          count: formattedDropsCount,
          timeAgo: timeAgoLabel,
        }
      )
    : null;
  const metrics = getExploreWaveMetrics(wave);
  const scoreSummaryLabel = getMetricsSummaryLabel(metrics);
  const cardAriaLabel =
    scoreSummaryLabel === null
      ? t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.viewAriaLabel", {
          waveName: wave.name,
        })
      : t(
          EXPLORE_WAVE_CARD_LOCALE,
          "waves.explore.card.viewWithScoreAriaLabel",
          {
            waveName: wave.name,
            scoreSummary: scoreSummaryLabel,
          }
        );

  return (
    <Link
      href={waveHref}
      prefetch={false}
      className={clsx(
        "tw-group tw-relative tw-flex tw-h-full tw-transform-gpu tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-text-left tw-no-underline tw-transition-[transform,border-color,background-color,box-shadow] tw-duration-500 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 desktop-hover:hover:-tw-translate-y-1 motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
        isDiscover
          ? "tw-min-h-[22rem] tw-border-white/[0.05] tw-bg-[#111113] tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_10px_28px_rgba(0,0,0,0.28)] desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.45)]"
          : "tw-border-white/[0.04] tw-bg-iron-950 tw-p-2 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900/70"
      )}
      aria-label={cardAriaLabel}
    >
      <div
        className={clsx(
          "tw-overflow-hidden tw-bg-iron-900",
          isDiscover
            ? "tw-absolute tw-inset-0"
            : "tw-relative tw-h-32 tw-flex-shrink-0 tw-rounded-lg sm:tw-h-36 lg:tw-h-32 xl:tw-h-36"
        )}
        style={imageAreaStyle}
      >
        {wave.picture && (
          <Image
            src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
            alt={t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.coverAlt", {
              waveName: wave.name,
            })}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className={clsx(
              "tw-transform-gpu tw-object-cover tw-duration-700 tw-ease-out desktop-hover:group-hover:tw-scale-105 motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
              isDiscover
                ? "tw-saturate-[.9] tw-transition-[transform,filter] group-focus-visible:tw-saturate-100 desktop-hover:group-hover:tw-saturate-100 touch-only:tw-saturate-100"
                : "tw-transition-transform"
            )}
          />
        )}
      </div>

      {isDiscover && (
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[linear-gradient(to_top,#050505_0%,rgba(5,5,5,0.98)_30%,rgba(5,5,5,0.84)_48%,rgba(5,5,5,0.42)_66%,transparent_84%)]"
        />
      )}

      <div
        className={clsx(
          "tw-relative tw-z-10 tw-flex tw-flex-1 tw-flex-col",
          isDiscover
            ? "tw-justify-end tw-px-5 tw-pb-5 tw-pt-40"
            : "tw-px-3 tw-pb-3 tw-pt-4 sm:tw-px-4 sm:tw-pb-4"
        )}
      >
        {isDiscover ? (
          <div className="tw-flex tw-items-end tw-justify-between tw-gap-4">
            <span className="tw-m-0 tw-line-clamp-1 tw-min-w-0 tw-break-words tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 tw-transition-colors tw-duration-300 desktop-hover:group-hover:tw-text-white">
              {wave.name}
            </span>
            <span
              aria-hidden="true"
              className="-tw-translate-x-1 tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800/80 tw-text-iron-100 tw-opacity-0 tw-transition-[transform,opacity,background-color,border-color] tw-duration-300 tw-ease-out group-focus-visible:tw-translate-x-0 group-focus-visible:tw-border-white/15 group-focus-visible:tw-bg-iron-700/80 group-focus-visible:tw-opacity-100 desktop-hover:group-hover:tw-translate-x-0 desktop-hover:group-hover:tw-border-white/15 desktop-hover:group-hover:tw-bg-iron-700/80 desktop-hover:group-hover:tw-opacity-100 motion-reduce:tw-transform-none motion-reduce:tw-transition-none touch-only:tw-translate-x-0 touch-only:tw-opacity-100"
            >
              <ArrowUpRightIcon className="tw-size-4" strokeWidth={2} />
            </span>
          </div>
        ) : (
          <span className="tw-m-0 tw-line-clamp-1 tw-break-words tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-100 tw-transition-colors tw-duration-300 desktop-hover:group-hover:tw-text-white sm:tw-text-lg">
            {wave.name}
          </span>
        )}
        {!isDiscover && (
          <ExploreWaveCompactMetrics metrics={metrics} variant={variant} />
        )}

        <MessagePreviewContent
          previewContent={descriptionPreview}
          variant={variant}
        />

        {isDiscover && (
          <ExploreWaveCompactMetrics metrics={metrics} variant={variant} />
        )}

        {hasDrops && (
          <div
            className={clsx(
              "tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1",
              isDiscover
                ? "tw-mt-3 tw-text-xs tw-text-iron-500"
                : "tw-mt-auto tw-pt-4 tw-text-[11px] tw-text-iron-600"
            )}
          >
            {isDiscover ? (
              <ClockIcon
                aria-hidden="true"
                className="tw-size-3 tw-flex-shrink-0"
                strokeWidth={1.75}
              />
            ) : (
              <span className="tw-size-1.5 tw-flex-shrink-0 tw-rounded-full tw-bg-success/80" />
            )}
            <span>{dropsCountLabel}</span>
          </div>
        )}

        {!hasDrops && (
          <div
            className={
              isDiscover
                ? "tw-mt-3 tw-text-xs tw-text-iron-500"
                : "tw-mt-auto tw-pt-4 tw-text-[11px] tw-text-iron-600"
            }
          >
            {t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.noDropsYet")}
          </div>
        )}
      </div>
    </Link>
  );
}

function ExploreWaveCompactMetrics({
  metrics,
  variant,
}: {
  readonly metrics: readonly ExploreWaveMetric[];
  readonly variant: ExploreWaveCardVariant;
}) {
  const isDiscover = variant === "discover";
  if (metrics.length === 0 && !isDiscover) {
    return null;
  }

  return (
    <span
      className={clsx(
        "explore-wave-card-metrics tw-flex tw-items-center",
        isDiscover
          ? "tw-mt-4 tw-min-h-6 tw-flex-wrap tw-gap-x-3 tw-gap-y-2"
          : "tw-mt-2.5 tw-flex-nowrap tw-gap-2 tw-overflow-hidden"
      )}
    >
      {metrics.map((metric, index) => (
        <span
          key={`${metric.ariaLabel}-${metric.value}`}
          className="tw-contents"
        >
          {index > 0 && !isDiscover && (
            <span className={METRIC_SEPARATOR_CLASSES} aria-hidden="true">
              &bull;
            </span>
          )}
          <span
            className={`${METRIC_CHIP_CLASSES} tw-gap-1 tw-text-[11px]`}
            aria-label={metric.ariaLabel}
          >
            <span className={metric.iconToneClasses}>{metric.icon}</span>
            {isDiscover && (
              <span className="tw-text-iron-400">{metric.label}</span>
            )}
            <span
              className={
                isDiscover
                  ? "tw-font-semibold tw-tabular-nums tw-text-iron-200"
                  : METRIC_VALUE_CLASSES
              }
            >
              {metric.value}
            </span>
          </span>
        </span>
      ))}
    </span>
  );
}

function MessagePreviewContent({
  previewContent,
  variant,
}: {
  readonly previewContent: ProcessedContent | null;
  readonly variant: ExploreWaveCardVariant;
}) {
  const isDiscover = variant === "discover";
  if (!previewContent) {
    return isDiscover ? (
      <div aria-hidden="true" className="tw-mt-2 tw-min-h-10" />
    ) : null;
  }

  return (
    <ContentDisplay
      content={previewContent}
      shouldClamp={false}
      className={clsx(
        "tw-flex tw-min-w-0 tw-items-start tw-gap-1 tw-overflow-hidden",
        isDiscover
          ? "tw-mt-2 tw-min-h-10"
          : "tw-mt-3 tw-text-iron-500"
      )}
      textClassName={clsx(
        "tw-line-clamp-2 tw-break-words tw-font-normal",
        isDiscover
          ? "tw-text-sm tw-leading-5 tw-text-iron-400"
          : "tw-text-xs tw-leading-relaxed"
      )}
      linkify={false}
    />
  );
}

function getWavePreviewContent(wave: SidebarWave): ProcessedContent | null {
  const combinedText = wave.descriptionDrop.contents?.trim() ?? "";
  const media = [...wave.descriptionDrop.media];

  if (!combinedText && media.length === 0) {
    return null;
  }

  return buildProcessedContent(combinedText || null, media);
}
