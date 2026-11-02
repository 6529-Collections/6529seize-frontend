"use client";

import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import {
  buildProcessedContent,
  type ProcessedContent,
} from "@/components/waves/drops/media-utils";
import { getRandomColorWithSeed, getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
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
import { useEffect, useRef, type ReactNode } from "react";
import { getWaveCardTint } from "./getWaveCardTint";

interface ExploreWaveCardProps {
  readonly wave: SidebarWave;
  readonly headingDetails?: ReactNode;
  readonly isApp?: boolean;
  readonly compact?: boolean;
  readonly horizontalOnMobile?: boolean;
  readonly subtleHover?: boolean;
  readonly artworkOverlay?: boolean;
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

function getWaveCardClassNames(
  horizontalOnMobile: boolean,
  subtleHover: boolean,
  artworkOverlay: boolean
) {
  const cardInteractionClassName = subtleHover
    ? "tw-transition-[transform,border-color,box-shadow] tw-duration-500 focus-visible:tw-border-white/20 desktop-hover:hover:tw-border-white/20 active:tw-border-white/20 md:motion-safe:desktop-hover:hover:-tw-translate-y-1 md:desktop-hover:hover:tw-shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_30px_60px_-20px_rgba(0,0,0,0.6)]"
    : "tw-transform-gpu tw-transition-[transform,border-color,box-shadow] tw-duration-300 desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-shadow-[0_14px_34px_rgba(0,0,0,0.36)]";
  const imageInteractionClassName = subtleHover
    ? "md:tw-transition-transform md:tw-duration-[1400ms] md:tw-ease-[cubic-bezier(0.2,0.7,0.2,1)] md:motion-safe:desktop-hover:group-hover:tw-scale-[1.06] md:motion-reduce:tw-transition-none"
    : "tw-transform-gpu tw-saturate-[.9] tw-transition-[transform,filter] tw-duration-700 tw-ease-out group-focus-visible:tw-saturate-100 desktop-hover:group-hover:tw-scale-105 desktop-hover:group-hover:tw-saturate-100 touch-only:tw-saturate-100 motion-reduce:tw-transform-none motion-reduce:tw-transition-none";
  if (artworkOverlay) {
    return {
      cardInteractionClassName,
      imageInteractionClassName,
      cardDirectionClassName: "tw-min-h-72 tw-w-full tw-min-w-0 tw-aspect-square tw-flex-col tw-justify-end md:tw-min-h-0",
      cardSurfaceClassName:
        "tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
      titleClassName:
        "tw-line-clamp-1 tw-text-[21px] tw-leading-[1.2] tw-tracking-[-0.025em] tw-text-white desktop-hover:group-hover:tw-text-white",
      imageSizeClassName: "tw-absolute tw-inset-0 tw-h-full tw-w-full",
      contentPaddingClassName:
        "tw-flex-none tw-px-[22px] tw-pb-5 tw-pt-16 tw-bg-[image:linear-gradient(to_top,rgb(var(--card-tint,19_19_22))_0%,rgb(var(--card-tint,19_19_22))_calc(100%_-_60px),rgb(var(--card-tint,19_19_22)/0.8)_calc(100%_-_34px),transparent_100%)]",
    };
  }
  const cardDirectionClassName = horizontalOnMobile
    ? "tw-flex-row md:tw-aspect-square md:tw-flex-col md:tw-justify-end"
    : "tw-flex-col";
  const cardSurfaceClassName = horizontalOnMobile
    ? "tw-rounded-xl tw-border-white/[0.06] tw-bg-iron-950 md:tw-border-0 md:tw-shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
    : "tw-rounded-lg tw-border-white/[0.05] tw-bg-iron-950";
  const titleClassName = horizontalOnMobile
    ? "tw-line-clamp-1 tw-text-[17px] tw-leading-[1.3] tw-tracking-[-0.015em] md:tw-text-[21px] md:tw-leading-[1.2] md:tw-tracking-[-0.025em] md:tw-text-white md:desktop-hover:group-hover:tw-text-white"
    : "tw-line-clamp-1 tw-text-lg tw-leading-tight tw-tracking-tight";
  const imageSizeClassName = horizontalOnMobile
    ? "tw-w-1/3 tw-self-stretch md:tw-absolute md:tw-inset-0 md:tw-h-full md:tw-w-full"
    : "tw-h-44 tw-rounded-t-lg sm:tw-h-48 lg:tw-h-44 xl:tw-h-48";
  const contentPaddingClassName = horizontalOnMobile
    ? "tw-px-4 tw-py-3.5 md:tw-flex-none md:tw-px-[22px] md:tw-pb-5 md:tw-pt-16 md:tw-bg-[image:linear-gradient(to_top,rgb(var(--card-tint,19_19_22))_0%,rgb(var(--card-tint,19_19_22))_calc(100%_-_60px),rgb(var(--card-tint,19_19_22)/0.8)_calc(100%_-_34px),transparent_100%)]"
    : "tw-px-4 tw-pb-4 tw-pt-2";
  return {
    cardInteractionClassName,
    imageInteractionClassName,
    cardDirectionClassName,
    cardSurfaceClassName,
    titleClassName,
    imageSizeClassName,
    contentPaddingClassName,
  };
}

export function ExploreWaveCard({
  wave,
  headingDetails,
  isApp = false,
  compact = false,
  horizontalOnMobile = false,
  subtleHover = false,
  artworkOverlay = false,
}: ExploreWaveCardProps) {
  const showArtworkOverlay = artworkOverlay && !compact;
  const imageRef = useRef<HTMLImageElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    const details = detailsRef.current;
    if (
      (!horizontalOnMobile && !showArtworkOverlay) ||
      compact ||
      !wave.picture ||
      !image ||
      !details
    )
      return;

    const desktop = window.matchMedia("(min-width: 768px)");
    const updateTint = () => {
      const tint =
        showArtworkOverlay || desktop.matches ? getWaveCardTint(image) : null;
      if (tint) details.style.setProperty("--card-tint", tint);
      else details.style.removeProperty("--card-tint");
    };
    image.addEventListener("load", updateTint);
    image.addEventListener("error", updateTint);
    desktop.addEventListener("change", updateTint);
    updateTint();
    return () => {
      image.removeEventListener("load", updateTint);
      image.removeEventListener("error", updateTint);
      desktop.removeEventListener("change", updateTint);
      details.style.removeProperty("--card-tint");
    };
  }, [horizontalOnMobile, showArtworkOverlay, compact, wave.picture]);

  const {
    cardInteractionClassName,
    imageInteractionClassName,
    cardDirectionClassName,
    cardSurfaceClassName,
    titleClassName,
    imageSizeClassName,
    contentPaddingClassName,
  } = getWaveCardClassNames(
    horizontalOnMobile,
    subtleHover,
    showArtworkOverlay
  );
  const waveHref = getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.isDirectMessage,
    isApp,
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
  const activityClassName = showArtworkOverlay
    ? "tw-mt-1.5 tw-font-medium tw-text-iron-400"
    : "tw-mt-2.5 tw-text-iron-500";
  const activityRow = !compact && (
    <div
      className={`${horizontalOnMobile ? "tw-mt-1 tw-font-medium tw-text-iron-500 md:tw-mt-1.5 md:tw-text-iron-400" : activityClassName} tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs`}
    >
      {!horizontalOnMobile && hasDrops && (
        <ClockIcon
          aria-hidden="true"
          className="tw-size-3 tw-flex-shrink-0"
          strokeWidth={1.75}
        />
      )}
      <span>
        {dropsCountLabel ??
          t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.noDropsYet")}
      </span>
    </div>
  );
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
      data-home-action="Open wave"
      href={waveHref}
      prefetch={false}
      className={`${compact ? "tw-flex-row" : cardDirectionClassName} ${cardSurfaceClassName} ${cardInteractionClassName} tw-group tw-relative tw-flex tw-h-full tw-overflow-hidden tw-border tw-border-solid tw-text-left tw-no-underline tw-shadow-[0_10px_28px_rgba(0,0,0,0.2)] tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transform-none motion-reduce:tw-transition-none`}
      aria-label={cardAriaLabel}
    >
      {compact && (
        <div
          className="tw-relative tw-w-20 tw-shrink-0 tw-self-stretch tw-overflow-hidden tw-bg-iron-900 sm:tw-w-24"
          style={imageAreaStyle}
        >
          {wave.picture && (
            <Image
              src={getScaledImageUri(wave.picture, ImageScale.W_200_H_200)}
              alt={t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.coverAlt", {
                waveName: wave.name,
              })}
              fill
              sizes="96px"
              className="tw-object-cover"
            />
          )}
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-r tw-from-transparent tw-to-iron-950/30"
          />
        </div>
      )}
      {!compact && (
        <div
          className={`${imageSizeClassName} ${showArtworkOverlay ? "" : "tw-relative"} tw-flex-shrink-0 tw-overflow-hidden tw-bg-iron-900`}
          style={imageAreaStyle}
        >
          {wave.picture && (
            <Image
              ref={imageRef}
              src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
              alt={t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.coverAlt", {
                waveName: wave.name,
              })}
              fill
              sizes={
                horizontalOnMobile
                  ? "(max-width: 639px) 33vw, (max-width: 767px) 17vw, (max-width: 1023px) 50vw, 33vw"
                  : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              }
              className={`tw-object-cover ${imageInteractionClassName}`}
            />
          )}
          <div
            aria-hidden="true"
            className={`${horizontalOnMobile || showArtworkOverlay ? "tw-hidden" : ""} tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-2/3 tw-bg-gradient-to-t tw-from-iron-950 tw-via-iron-950/50 tw-to-transparent`}
          />
        </div>
      )}

      <div
        ref={detailsRef}
        className={`tw-relative tw-z-10 tw-flex tw-min-w-0 tw-flex-1 tw-flex-col ${compact ? "tw-p-3" : contentPaddingClassName}`}
      >
        <div
          className={compact ? "tw-flex tw-min-w-0 tw-items-start" : undefined}
        >
          <span
            className={`${compact ? "tw-flex-1 tw-truncate tw-text-base tw-leading-6 tw-tracking-tight" : titleClassName} ${subtleHover ? "tw-duration-200 tw-ease-out" : "tw-duration-300"} tw-m-0 tw-min-w-0 tw-break-words tw-font-semibold tw-text-iron-50 tw-transition-colors group-focus-visible:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300 motion-reduce:tw-transition-none`}
          >
            {wave.name}
          </span>
        </div>

        {(horizontalOnMobile || showArtworkOverlay) && activityRow}

        {headingDetails}

        {horizontalOnMobile ? (
          <div className="tw-mb-3 tw-mt-2 tw-flex tw-min-w-0 tw-items-start tw-overflow-hidden tw-text-sm tw-leading-[1.45] md:tw-mb-4 md:tw-mt-3 md:tw-min-h-5 md:tw-text-[13px] md:tw-leading-5">
            <p className="tw-m-0 tw-line-clamp-1 tw-break-words tw-font-normal tw-text-iron-400 md:tw-text-white/55">
              {markdownToPlainText(wave.descriptionDrop.contents ?? "", {
                includeImageUrls: false,
                includeLinkDestinations: false,
              })}
            </p>
          </div>
        ) : (
          <MessagePreviewContent
            previewContent={getWavePreviewContent(wave)}
            compact={compact}
            artworkOverlay={showArtworkOverlay}
          />
        )}

        <ExploreWaveCompactMetrics
          metrics={metrics}
          compact={compact}
          horizontalOnMobile={horizontalOnMobile}
          artworkOverlay={showArtworkOverlay}
        />

        {!horizontalOnMobile && !showArtworkOverlay && activityRow}
      </div>
    </Link>
  );
}

function ExploreWaveCompactMetrics({
  metrics,
  compact,
  horizontalOnMobile,
  artworkOverlay,
}: {
  readonly metrics: readonly ExploreWaveMetric[];
  readonly compact: boolean;
  readonly horizontalOnMobile: boolean;
  readonly artworkOverlay: boolean;
}) {
  let defaultSpacingClassName = compact ? "tw-mt-2" : "tw-mt-3";
  if (artworkOverlay) defaultSpacingClassName = "tw-mt-0";
  const metricIconClassName = artworkOverlay ? "tw-opacity-70" : "";
  const metricValueClassName = artworkOverlay
    ? "tw-text-white/70"
    : "tw-text-iron-200";
  const spacingClassName = horizontalOnMobile
    ? "tw-mt-auto tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-2.5 md:tw-mt-0 md:tw-border-t-0 md:tw-pt-0"
    : defaultSpacingClassName;

  return (
    <span
      className={`explore-wave-card-metrics ${spacingClassName} tw-flex tw-min-h-5 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5`}
    >
      {metrics.map((metric) => (
        <span
          key={`${metric.ariaLabel}-${metric.value}`}
          className="tw-contents"
        >
          <span
            className={`${METRIC_CHIP_CLASSES} ${horizontalOnMobile || artworkOverlay ? "tw-text-xs" : "tw-text-[11px]"} tw-gap-1`}
            aria-label={metric.ariaLabel}
          >
            <span
              className={`${metric.iconToneClasses} ${horizontalOnMobile ? "md:tw-opacity-70" : metricIconClassName}`}
            >
              {metric.icon}
            </span>
            <span className="tw-text-iron-400">{metric.label}</span>
            <span
              className={`${horizontalOnMobile ? "tw-text-iron-50 md:tw-text-white/70" : metricValueClassName} tw-font-semibold tw-tabular-nums`}
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
  compact,
  artworkOverlay,
}: {
  readonly previewContent: ProcessedContent | null;
  readonly compact: boolean;
  readonly artworkOverlay: boolean;
}) {
  const previewClassName = artworkOverlay
    ? "tw-mb-4 tw-mt-3 tw-min-h-9"
    : "tw-mt-1.5 tw-min-h-9";
  const previewTextClassName = artworkOverlay
    ? "tw-text-white/55"
    : "tw-text-iron-500";
  const emptyPreviewClassName = artworkOverlay
    ? previewClassName
    : "tw-mt-2 tw-min-h-10";
  if (!previewContent) {
    return (
      <div
        aria-hidden="true"
        className={compact ? "tw-mt-1.5 tw-h-[18px]" : emptyPreviewClassName}
      />
    );
  }

  return (
    <ContentDisplay
      content={previewContent}
      shouldClamp={false}
      className={`${compact ? "tw-mt-1.5 tw-h-[18px]" : previewClassName} tw-flex tw-min-w-0 tw-items-start tw-gap-1 tw-overflow-hidden`}
      textClassName={`${compact ? "tw-line-clamp-1" : "tw-line-clamp-2"} tw-text-[13px] tw-leading-[18px] ${previewTextClassName} tw-break-words tw-font-normal`}
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
