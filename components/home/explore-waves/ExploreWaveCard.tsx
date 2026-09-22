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
  ClockIcon,
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface ExploreWaveCardProps {
  readonly wave: SidebarWave;
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

export function ExploreWaveCard({ wave }: ExploreWaveCardProps) {
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
  const shouldAppendAgo = /^\d+[hm]$/.test(timeAgoLabel);
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
      className="tw-group tw-relative tw-flex tw-h-full tw-transform-gpu tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-iron-950 tw-text-left tw-no-underline tw-shadow-[0_10px_28px_rgba(0,0,0,0.2)] tw-transition-[transform,border-color,box-shadow] tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-shadow-[0_14px_34px_rgba(0,0,0,0.36)] motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
      aria-label={cardAriaLabel}
    >
      <div
        className="tw-relative tw-h-44 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-t-lg tw-bg-iron-900 sm:tw-h-48 lg:tw-h-44 xl:tw-h-48"
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
            className="tw-transform-gpu tw-object-cover tw-saturate-[.9] tw-transition-[transform,filter] tw-duration-700 tw-ease-out group-focus-visible:tw-saturate-100 desktop-hover:group-hover:tw-scale-105 desktop-hover:group-hover:tw-saturate-100 touch-only:tw-saturate-100 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
          />
        )}
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-2/3 tw-bg-gradient-to-t tw-from-iron-950 tw-via-iron-950/50 tw-to-transparent"
        />
      </div>

      <div className="tw-relative tw-z-10 tw-flex tw-flex-1 tw-flex-col tw-px-4 tw-pb-4 tw-pt-2">
        <span className="tw-m-0 tw-line-clamp-1 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 tw-transition-colors tw-duration-300 group-focus-visible:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300">
          {wave.name}
        </span>

        <MessagePreviewContent previewContent={descriptionPreview} />

        <ExploreWaveCompactMetrics metrics={metrics} />

        {hasDrops && (
          <div className="tw-mt-2.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-text-iron-500">
            <ClockIcon
              aria-hidden="true"
              className="tw-size-3 tw-flex-shrink-0"
              strokeWidth={1.75}
            />
            <span>{dropsCountLabel}</span>
          </div>
        )}

        {!hasDrops && (
          <div className="tw-mt-2.5 tw-text-xs tw-text-iron-500">
            {t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.noDropsYet")}
          </div>
        )}
      </div>
    </Link>
  );
}

function ExploreWaveCompactMetrics({
  metrics,
}: {
  readonly metrics: readonly ExploreWaveMetric[];
}) {
  return (
    <span className="explore-wave-card-metrics tw-mt-3 tw-flex tw-min-h-5 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5">
      {metrics.map((metric) => (
        <span
          key={`${metric.ariaLabel}-${metric.value}`}
          className="tw-contents"
        >
          <span
            className={`${METRIC_CHIP_CLASSES} tw-gap-1 tw-text-[11px]`}
            aria-label={metric.ariaLabel}
          >
            <span className={metric.iconToneClasses}>{metric.icon}</span>
            <span className="tw-text-iron-400">{metric.label}</span>
            <span className="tw-font-semibold tw-tabular-nums tw-text-iron-200">
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
}: {
  readonly previewContent: ProcessedContent | null;
}) {
  if (!previewContent) {
    return <div aria-hidden="true" className="tw-mt-2 tw-min-h-10" />;
  }

  return (
    <ContentDisplay
      content={previewContent}
      shouldClamp={false}
      className="tw-mt-1.5 tw-flex tw-min-h-9 tw-min-w-0 tw-items-start tw-gap-1 tw-overflow-hidden"
      textClassName="tw-line-clamp-2 tw-break-words tw-text-[13px] tw-font-normal tw-leading-[18px] tw-text-iron-500"
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
