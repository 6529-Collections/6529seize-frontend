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
import { getWaveTrustSummaryLabel } from "@/components/waves/WaveTrustSignals";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface ExploreWaveCardProps {
  readonly wave: SidebarWave;
}

const EXPLORE_WAVE_CARD_LOCALE = DEFAULT_LOCALE;
const METRIC_CHIP_CLASSES =
  "tw-inline-flex tw-items-center tw-cursor-help tw-gap-1 tw-whitespace-nowrap tw-rounded-md tw-px-1.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none";
const METRIC_ICON_CLASSES = "tw-size-3.5 tw-flex-shrink-0";
const METRIC_VALUE_CLASSES = "tw-text-[11px] tw-font-semibold tw-tabular-nums";
const METRIC_SEPARATOR_CLASSES =
  "tw-text-[11px] tw-leading-none tw-text-iron-500/70";

const getDropsCountMessageKey = (
  count: number
):
  | "waves.explore.card.dropsCount.one"
  | "waves.explore.card.dropsCount.other" => {
  const pluralCategory = new Intl.PluralRules(EXPLORE_WAVE_CARD_LOCALE).select(
    count
  );

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
    return "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300";
  }

  if (value >= 85) {
    return "tw-text-emerald-400 desktop-hover:hover:tw-text-emerald-300";
  }

  if (value >= 65) {
    return "tw-text-sky-400 desktop-hover:hover:tw-text-sky-300";
  }

  if (value < 35) {
    return "tw-text-rose-400 desktop-hover:hover:tw-text-rose-300";
  }

  return "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300";
};

const getRepToneClasses = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300";
  }

  return value > 0
    ? "tw-text-emerald-400 desktop-hover:hover:tw-text-emerald-300"
    : "tw-text-rose-400 desktop-hover:hover:tw-text-rose-300";
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
  const dropsCountLabel = hasDrops
    ? t(
        EXPLORE_WAVE_CARD_LOCALE,
        getDropsCountMessageKey(wave.totalDropsCount),
        {
          count: formattedDropsCount,
          timeAgo: getTimeAgoShort(lastMessageTime),
        }
      )
    : null;
  const scoreSummaryLabel = getWaveTrustSummaryLabel({
    waveRep: wave.waveRep,
    waveScore: wave.waveScore,
  });
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
      className="tw-group tw-relative tw-block tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-left tw-no-underline tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500/30"
      aria-label={cardAriaLabel}
    >
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-rounded-xl tw-border tw-border-solid tw-border-white/10" />
      <div
        className="tw-relative tw-aspect-[20/9] tw-overflow-hidden"
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
            className="tw-object-cover tw-transition-transform tw-duration-700 tw-will-change-transform desktop-hover:group-hover:tw-scale-105"
          />
        )}
      </div>

      <div className="tw-px-4 tw-py-6 sm:tw-p-5">
        <span className="tw-m-0 tw-line-clamp-1 tw-break-words tw-text-sm tw-font-semibold tw-leading-tight tw-text-white tw-transition-colors group-hover:tw-text-white/80 sm:tw-text-base">
          {wave.name}
        </span>
        <ExploreWaveCompactMetrics wave={wave} />

        {descriptionPreview && (
          <MessagePreviewContent previewContent={descriptionPreview} />
        )}

        {hasDrops && (
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            <span className="tw-relative tw-flex tw-h-2 tw-w-2">
              <span className="tw-absolute tw-inline-flex tw-h-full tw-w-full tw-animate-ping tw-rounded-full tw-bg-success/60" />
              <span className="tw-relative tw-inline-flex tw-h-2 tw-w-2 tw-rounded-full tw-bg-success" />
            </span>
            <span className="tw-text-iron-300">{dropsCountLabel}</span>
          </div>
        )}

        {!hasDrops && (
          <div className="tw-mt-3 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            {t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.noDropsYet")}
          </div>
        )}
      </div>
    </Link>
  );
}

function ExploreWaveCompactMetrics({ wave }: { readonly wave: SidebarWave }) {
  const visibilityScore = formatScore(wave.waveScore?.visibility_score);
  const hotnessScore = formatScore(wave.waveScore?.hotness_score);
  const repScore =
    wave.waveRep === null
      ? formatScore(wave.waveScore?.rep_sort_score)
      : formatRep(wave.waveRep.total_rep);
  const repAccessibleValue = formatRepAccessibleValue(wave.waveRep?.total_rep);
  let repAriaLabel: string | null = null;
  if (repScore !== null) {
    repAriaLabel =
      repAccessibleValue !== null
        ? t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repAriaRaw", {
            value: repAccessibleValue,
          })
        : t(EXPLORE_WAVE_CARD_LOCALE, "waves.score.details.repAriaScore", {
            repScore,
          });
  }

  const metrics = [
    visibilityScore === null
      ? null
      : {
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
          toneClasses: getVisibilityToneClasses(
            wave.waveScore?.visibility_score
          ),
          value: visibilityScore,
        },
    hotnessScore === null
      ? null
      : {
          ariaLabel: t(
            EXPLORE_WAVE_CARD_LOCALE,
            "waves.score.details.hotnessAria",
            {
              hotnessScore,
            }
          ),
          icon: (
            <FireIcon
              className={METRIC_ICON_CLASSES}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ),
          toneClasses:
            "tw-text-amber-400 desktop-hover:hover:tw-text-amber-300",
          value: hotnessScore,
        },
    repScore === null
      ? null
      : {
          ariaLabel: repAriaLabel ?? "",
          icon: (
            <ScaleIcon
              className={METRIC_ICON_CLASSES}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ),
          toneClasses: getRepToneClasses(wave.waveRep?.total_rep),
          value: repScore,
        },
  ].filter((metric) => metric !== null);

  if (metrics.length === 0) {
    return null;
  }

  return (
    <span className="explore-wave-card-metrics tw-mt-3 tw-flex tw-flex-nowrap tw-items-center tw-gap-1.5 tw-overflow-hidden">
      {metrics.map((metric, index) => (
        <span
          key={`${metric.ariaLabel}-${metric.value}`}
          className="tw-contents"
        >
          {index > 0 && (
            <span className={METRIC_SEPARATOR_CLASSES} aria-hidden="true">
              &bull;
            </span>
          )}
          <span
            className={`${METRIC_CHIP_CLASSES} ${metric.toneClasses}`}
            aria-label={metric.ariaLabel}
          >
            {metric.icon}
            <span className={METRIC_VALUE_CLASSES}>{metric.value}</span>
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
    return null;
  }

  return (
    <ContentDisplay
      content={previewContent}
      shouldClamp={false}
      className="tw-mt-2.5 tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-1 tw-overflow-hidden tw-text-iron-500"
      textClassName="tw-line-clamp-2 tw-break-words tw-text-[10px] tw-font-normal tw-leading-tight sm:tw-text-xs"
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
