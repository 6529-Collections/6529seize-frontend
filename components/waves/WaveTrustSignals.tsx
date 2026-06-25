import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

type WaveTrustSignalsVariant =
  | "card"
  | "sidebar"
  | "sidebar-inline"
  | "header-inline";
type WaveTrustSignalsMode = "details" | "summary";

interface WaveTrustSignalsProps {
  readonly waveRep?: ApiWaveRepSummary | null | undefined;
  readonly waveScore?: ApiWaveScore | null | undefined;
  readonly variant?: WaveTrustSignalsVariant | undefined;
  readonly mode?: WaveTrustSignalsMode | undefined;
  readonly className?: string | undefined;
  readonly tooltipId?: string | undefined;
  readonly learnMoreHref?: string | undefined;
}

const WAVE_TRUST_LOCALE = DEFAULT_LOCALE;
const compactNumber = (value: number): string =>
  formatNumber(WAVE_TRUST_LOCALE, value, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

const formatScore = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return formatInteger(WAVE_TRUST_LOCALE, Math.round(value));
};

const formatRep = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  if (value > 0) {
    return `+${compactNumber(value)}`;
  }

  return compactNumber(value);
};

const formatSignedFullNumber = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const formatted = formatInteger(WAVE_TRUST_LOCALE, Math.abs(value));
  if (value > 0) {
    return `+${formatted}`;
  }
  if (value < 0) {
    return `-${formatted}`;
  }
  return formatted;
};

const formatRepAccessibleValue = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const formatted = formatInteger(WAVE_TRUST_LOCALE, Math.abs(value));
  if (value > 0) {
    return t(WAVE_TRUST_LOCALE, "waves.score.details.repPositive", {
      value: formatted,
    });
  }
  if (value < 0) {
    return t(WAVE_TRUST_LOCALE, "waves.score.details.repNegative", {
      value: formatted,
    });
  }
  return t(WAVE_TRUST_LOCALE, "waves.score.details.repNeutral", {
    value: formatted,
  });
};

const isInlineSidebarVariant = (variant: WaveTrustSignalsVariant): boolean =>
  variant === "sidebar-inline";

const isInlineHeaderVariant = (variant: WaveTrustSignalsVariant): boolean =>
  variant === "header-inline";

const isInlineVariant = (variant: WaveTrustSignalsVariant): boolean =>
  isInlineSidebarVariant(variant) || isInlineHeaderVariant(variant);

const isSidebarVariant = (variant: WaveTrustSignalsVariant): boolean =>
  variant === "sidebar" || isInlineSidebarVariant(variant);

const INLINE_STAT_TONE_CLASSES =
  "tw-text-[#e2e8f0]/[0.85] desktop-hover:hover:tw-text-[#e2e8f0]/[0.95]";

type VisibilityTone = "excellent" | "healthy" | "low" | "default";
type VisibilityToneContext = "inline-sidebar" | "inline-header" | "default";

const VISIBILITY_TONE_CLASSES: Record<
  VisibilityToneContext,
  Record<VisibilityTone, string>
> = {
  "inline-sidebar": {
    excellent: INLINE_STAT_TONE_CLASSES,
    healthy: INLINE_STAT_TONE_CLASSES,
    low: INLINE_STAT_TONE_CLASSES,
    default: INLINE_STAT_TONE_CLASSES,
  },
  "inline-header": {
    excellent: "tw-text-emerald-400 desktop-hover:hover:tw-text-emerald-300",
    healthy: "tw-text-amber-400 desktop-hover:hover:tw-text-amber-300",
    low: "tw-text-rose-400 desktop-hover:hover:tw-text-rose-300",
    default: "tw-text-primary-300 desktop-hover:hover:tw-text-[#A8C4FF]",
  },
  default: {
    excellent:
      "tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-emerald-400/25",
    healthy: "tw-bg-amber-500/10 tw-text-amber-200 tw-ring-amber-400/25",
    low: "tw-bg-rose-500/10 tw-text-rose-200 tw-ring-rose-400/25",
    default: "tw-bg-sky-500/10 tw-text-sky-200 tw-ring-sky-400/25",
  },
};

const getVisibilityTone = (
  value: number | null | undefined
): VisibilityTone => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "default";
  }

  if (value >= 85) {
    return "excellent";
  }

  if (value >= 65) {
    return "healthy";
  }

  return value < 35 ? "low" : "default";
};

const getVisibilityToneContext = (
  variant: WaveTrustSignalsVariant
): VisibilityToneContext => {
  if (isInlineSidebarVariant(variant)) {
    return "inline-sidebar";
  }

  return isInlineHeaderVariant(variant) ? "inline-header" : "default";
};

const getVisibilityToneClasses = (
  variant: WaveTrustSignalsVariant,
  value: number | null | undefined
): string =>
  VISIBILITY_TONE_CLASSES[getVisibilityToneContext(variant)][
    getVisibilityTone(value)
  ];

const getHotnessToneClasses = (variant: WaveTrustSignalsVariant): string => {
  if (isInlineSidebarVariant(variant)) {
    return INLINE_STAT_TONE_CLASSES;
  }

  if (isInlineHeaderVariant(variant)) {
    return "tw-text-amber-400 desktop-hover:hover:tw-text-amber-300";
  }

  return "tw-bg-amber-500/10 tw-text-amber-200 tw-ring-amber-400/25";
};

const getRepToneClasses = (
  value: number | null | undefined,
  variant: WaveTrustSignalsVariant
): string => {
  if (isInlineSidebarVariant(variant)) {
    return INLINE_STAT_TONE_CLASSES;
  }

  if (value === null || value === undefined || value === 0) {
    if (isInlineHeaderVariant(variant)) {
      return "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300";
    }

    return "tw-bg-iron-800/80 tw-text-iron-300 tw-ring-iron-600/70";
  }

  if (value > 0) {
    if (isInlineHeaderVariant(variant)) {
      return "tw-text-emerald-400 desktop-hover:hover:tw-text-emerald-300";
    }

    return "tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-emerald-400/25";
  }

  if (isInlineHeaderVariant(variant)) {
    return "tw-text-rose-400 desktop-hover:hover:tw-text-rose-300";
  }

  return "tw-bg-rose-500/10 tw-text-rose-200 tw-ring-rose-400/25";
};

const getContainerClasses = (
  variant: WaveTrustSignalsVariant,
  mode: WaveTrustSignalsMode,
  className: string | undefined
) => {
  let baseClasses = "tw-flex tw-flex-wrap tw-items-center tw-gap-1.5";
  if (mode === "summary") {
    baseClasses =
      "tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-1.5";
  }

  if (isInlineSidebarVariant(variant)) {
    baseClasses =
      mode === "summary"
        ? "tw-inline-flex tw-min-w-0 tw-items-center tw-gap-[4px] tw-align-middle"
        : "tw-inline-flex tw-items-center tw-gap-[11px] tw-align-middle";
  }

  return [
    baseClasses,
    variant === "sidebar" && mode === "details" ? "tw-mt-1" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
};

const getChipClasses = (
  variant: WaveTrustSignalsVariant,
  mode: WaveTrustSignalsMode,
  toneClasses: string
) => {
  let variantClasses = "tw-gap-1 tw-rounded-md tw-ring-1 tw-ring-inset";
  let sizeClasses = "tw-h-6 tw-px-2 tw-text-[11px] sm:tw-text-xs";

  if (isInlineSidebarVariant(variant)) {
    variantClasses =
      "tw-cursor-help tw-gap-[3px] tw-whitespace-nowrap tw-text-[11px] tw-font-semibold tw-leading-none";
    sizeClasses = "";
  } else if (isInlineHeaderVariant(variant)) {
    variantClasses =
      "tw-cursor-help tw-gap-1 tw-whitespace-nowrap tw-rounded-md tw-px-1.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none";
    sizeClasses = "";
  } else if (variant === "sidebar") {
    sizeClasses = "tw-h-5 tw-px-1.5 tw-text-[10px]";
  }

  let summaryClasses = "";
  if (mode === "summary") {
    summaryClasses = "tw-shrink-0 tw-justify-center";
    if (variant === "sidebar") {
      summaryClasses = `${summaryClasses} tw-w-[4.75rem]`;
    } else if (isInlineSidebarVariant(variant)) {
      summaryClasses = `${summaryClasses} tw-min-w-[2.35rem]`;
    }
  }

  return [
    "tw-inline-flex tw-items-center",
    variantClasses,
    sizeClasses,
    summaryClasses,
    toneClasses,
  ].join(" ");
};

const getChipLabelClasses = (variant: WaveTrustSignalsVariant): string => {
  if (isInlineHeaderVariant(variant)) {
    return "tw-text-[11px] tw-font-medium tw-text-iron-400";
  }

  if (isInlineSidebarVariant(variant)) {
    return "tw-text-[11px] tw-font-medium";
  }

  if (variant === "sidebar") {
    return "tw-text-[9px] tw-font-semibold";
  }

  return "tw-text-[10px] tw-font-semibold sm:tw-text-[11px]";
};

const getIconClasses = (variant: WaveTrustSignalsVariant): string => {
  if (isInlineSidebarVariant(variant)) {
    return "tw-size-3 tw-flex-shrink-0 tw-opacity-[0.55]";
  }

  if (isInlineHeaderVariant(variant)) {
    return "tw-size-3.5 tw-flex-shrink-0";
  }

  return "tw-size-3.5";
};

const getValueClasses = (variant: WaveTrustSignalsVariant): string => {
  if (isInlineSidebarVariant(variant)) {
    return "tw-tabular-nums";
  }

  if (isInlineHeaderVariant(variant)) {
    return "tw-text-[11px] tw-font-semibold tw-tabular-nums";
  }

  return "tw-tabular-nums";
};

const getSeparatorClasses = (variant: WaveTrustSignalsVariant): string => {
  if (isInlineHeaderVariant(variant)) {
    return "tw-text-[11px] tw-leading-none tw-text-iron-500/70";
  }

  return "";
};

const getTooltipAttributes = (
  tooltipId: string | undefined,
  content: string
): Record<string, string> => {
  if (tooltipId === undefined) {
    return {};
  }

  return {
    "data-tooltip-id": tooltipId,
    "data-tooltip-content": content,
  };
};

const getRepScore = ({
  waveRep,
  waveScore,
}: {
  readonly waveRep?: ApiWaveRepSummary | null | undefined;
  readonly waveScore?: ApiWaveScore | null | undefined;
}): string | null => {
  if (waveRep === null || waveRep === undefined) {
    return formatScore(waveScore?.rep_sort_score);
  }

  return formatRep(waveRep.total_rep);
};

export const hasWaveTrustSummaryScore = (
  waveScore?: ApiWaveScore | null | undefined
): boolean => formatScore(waveScore?.visibility_score) !== null;

const buildSummaryRepDetail = ({
  rawRep,
  repSortScore,
}: {
  readonly rawRep: string | null;
  readonly repSortScore: string | null;
}): string | null => {
  if (rawRep !== null && repSortScore !== null) {
    return t(WAVE_TRUST_LOCALE, "waves.score.summary.repRawAndScore", {
      rawRep,
      repSortScore,
    });
  }

  if (rawRep !== null) {
    return t(WAVE_TRUST_LOCALE, "waves.score.summary.repRaw", {
      rawRep,
    });
  }

  if (repSortScore !== null) {
    return t(WAVE_TRUST_LOCALE, "waves.score.summary.repScore", {
      repSortScore,
    });
  }

  return null;
};

const buildSummaryDetails = ({
  visibilityScore,
  qualityScore,
  hotnessScore,
  repSortScore,
  waveRep,
}: {
  readonly visibilityScore: string;
  readonly qualityScore: string | null;
  readonly hotnessScore: string | null;
  readonly repSortScore: string | null;
  readonly waveRep: ApiWaveRepSummary | null | undefined;
}): string[] => {
  const rawRep = formatSignedFullNumber(waveRep?.total_rep);
  const repDetail = buildSummaryRepDetail({ rawRep, repSortScore });

  return [
    t(WAVE_TRUST_LOCALE, "waves.score.summary.scoreAria", {
      visibilityScore,
    }),
    ...(qualityScore === null
      ? []
      : [
          t(WAVE_TRUST_LOCALE, "waves.score.summary.qualityAria", {
            qualityScore,
          }),
        ]),
    ...(hotnessScore === null
      ? []
      : [
          t(WAVE_TRUST_LOCALE, "waves.score.summary.hotnessAria", {
            hotnessScore,
          }),
        ]),
    ...(repDetail === null ? [] : [repDetail]),
  ];
};

const buildHotnessDetails = ({
  hotnessScore,
  qualityScore,
}: {
  readonly hotnessScore: string;
  readonly qualityScore: string | null;
}): string[] => {
  return [
    t(WAVE_TRUST_LOCALE, "waves.score.details.hotnessTitle", {
      hotnessScore,
    }),
    ...(qualityScore === null
      ? []
      : [
          t(WAVE_TRUST_LOCALE, "waves.score.details.qualityInput", {
            qualityScore,
          }),
        ]),
    t(WAVE_TRUST_LOCALE, "waves.score.details.recentTrustedActivity"),
    t(WAVE_TRUST_LOCALE, "waves.score.details.hotnessQualityGate"),
  ];
};

const buildRepDetails = ({
  repSortScore,
  waveRep,
}: {
  readonly repSortScore: string | null;
  readonly waveRep: ApiWaveRepSummary | null | undefined;
}): string[] => {
  const rawRep = formatSignedFullNumber(waveRep?.total_rep);

  return [
    ...(rawRep === null
      ? []
      : [
          t(WAVE_TRUST_LOCALE, "waves.score.details.repRaw", {
            rawRep,
          }),
        ]),
    ...(repSortScore === null
      ? []
      : [
          t(WAVE_TRUST_LOCALE, "waves.score.details.repScore", {
            repSortScore,
          }),
        ]),
    t(WAVE_TRUST_LOCALE, "waves.score.details.repQualityWeight"),
  ];
};

function WaveScoreSummaryPopoverContent({
  learnMoreHref,
  visibilityScore,
  qualityScore,
  hotnessScore,
  repSortScore,
  waveRep,
}: {
  readonly learnMoreHref?: string | undefined;
  readonly visibilityScore: string;
  readonly qualityScore: string | null;
  readonly hotnessScore: string | null;
  readonly repSortScore: string | null;
  readonly waveRep: ApiWaveRepSummary | null | undefined;
}) {
  const rawRep = formatSignedFullNumber(waveRep?.total_rep);
  const rows = [
    ...(qualityScore === null
      ? []
      : [
          {
            label: t(WAVE_TRUST_LOCALE, "waves.score.summary.quality"),
            value: t(WAVE_TRUST_LOCALE, "waves.score.summary.qualityValue", {
              qualityScore,
            }),
          },
        ]),
    ...(hotnessScore === null
      ? []
      : [
          {
            label: t(WAVE_TRUST_LOCALE, "waves.score.summary.hotness"),
            value: t(WAVE_TRUST_LOCALE, "waves.score.summary.hotnessValue", {
              hotnessScore,
            }),
          },
        ]),
    ...(rawRep === null && repSortScore === null
      ? []
      : [
          {
            label: t(WAVE_TRUST_LOCALE, "waves.score.summary.waveRep"),
            value:
              rawRep !== null && repSortScore !== null
                ? t(
                    WAVE_TRUST_LOCALE,
                    "waves.score.summary.repRawAndScoreValue",
                    {
                      rawRep,
                      repSortScore,
                    }
                  )
                : (rawRep ??
                  t(WAVE_TRUST_LOCALE, "waves.score.summary.repScoreValue", {
                    repSortScore: repSortScore ?? "",
                  })),
          },
        ]),
  ];

  return (
    <div className="tw-w-48 tw-bg-transparent tw-text-left tw-text-[11px] tw-leading-4 tw-text-iron-300">
      <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <span className="tw-font-semibold tw-text-white">
          {t(WAVE_TRUST_LOCALE, "waves.score.summary.title")}
        </span>
        <span className="tw-font-semibold tw-tabular-nums tw-text-primary-300">
          {visibilityScore}
        </span>
      </div>
      {rows.length > 0 && (
        <div className="tw-mt-1.5 tw-space-y-1 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-1.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-baseline tw-gap-2.5"
            >
              <span className="tw-min-w-0 tw-truncate tw-text-iron-500">
                {row.label}
              </span>
              <span className="tw-text-right tw-font-medium tw-tabular-nums tw-text-iron-200">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {learnMoreHref !== undefined && (
        <Link
          href={learnMoreHref}
          className="desktop-hover:hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-items-center tw-rounded-md tw-text-[11px] tw-font-semibold tw-text-primary-300 tw-no-underline tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(WAVE_TRUST_LOCALE, "waves.score.summary.learnMore")}
        </Link>
      )}
    </div>
  );
}

export function WaveScoreSummaryHoverCard({
  children,
  closeOnContentClick,
  learnMoreHref,
  stopClickPropagation,
  triggerDisplay,
  waveRep,
  waveScore,
}: {
  readonly children: ReactElement;
  readonly closeOnContentClick?: boolean | undefined;
  readonly learnMoreHref?: string | undefined;
  readonly stopClickPropagation?: boolean | undefined;
  readonly triggerDisplay?: "contents" | "inline-flex" | undefined;
  readonly waveRep: ApiWaveRepSummary | null | undefined;
  readonly waveScore: ApiWaveScore | null | undefined;
}) {
  const visibilityScore = formatScore(waveScore?.visibility_score);
  const qualityScore = formatScore(waveScore?.quality_score);
  const hotnessScore = formatScore(waveScore?.hotness_score);
  const repSortScore = formatScore(waveScore?.rep_sort_score);

  if (visibilityScore === null) {
    return children;
  }

  return (
    <HoverCard
      ariaLabel={t(WAVE_TRUST_LOCALE, "waves.score.summary.detailsAriaLabel")}
      placement="bottom"
      delayShow={100}
      delayHide={120}
      hoverTransitionDelay={80}
      offset={8}
      openOnClick
      closeOnContentClick={closeOnContentClick}
      stopClickPropagation={stopClickPropagation}
      triggerDisplay={triggerDisplay}
      contentStyle={{ padding: "10px 12px" }}
      content={
        <WaveScoreSummaryPopoverContent
          learnMoreHref={learnMoreHref}
          visibilityScore={visibilityScore}
          qualityScore={qualityScore}
          hotnessScore={hotnessScore}
          repSortScore={repSortScore}
          waveRep={waveRep}
        />
      }
    >
      {children}
    </HoverCard>
  );
}
const renderContainer = ({
  children,
  className,
  variant,
}: {
  readonly children: ReactNode;
  readonly className: string;
  readonly variant: WaveTrustSignalsVariant;
}) => {
  if (isInlineVariant(variant)) {
    return <span className={className}>{children}</span>;
  }

  return <div className={className}>{children}</div>;
};

export function WaveTrustSignals({
  waveRep,
  waveScore,
  variant = "card",
  mode = "details",
  className,
  tooltipId,
  learnMoreHref,
}: WaveTrustSignalsProps) {
  const visibilityScore = formatScore(waveScore?.visibility_score);
  const qualityScore = formatScore(waveScore?.quality_score);
  const hotnessScore = formatScore(waveScore?.hotness_score);
  const repSortScore = formatScore(waveScore?.rep_sort_score);
  const hasRepSummary = waveRep !== null && waveRep !== undefined;
  const repScore = getRepScore({ waveRep, waveScore });
  let repAccessibleValue: string | null = null;
  if (waveRep !== null && waveRep !== undefined) {
    repAccessibleValue = formatRepAccessibleValue(waveRep.total_rep);
  }
  let repLabel: string | null = null;
  if (hasRepSummary && repAccessibleValue !== null) {
    repLabel = t(WAVE_TRUST_LOCALE, "waves.score.details.repAriaRaw", {
      value: repAccessibleValue,
    });
  }
  if (!hasRepSummary && repScore !== null) {
    repLabel = t(WAVE_TRUST_LOCALE, "waves.score.details.repAriaScore", {
      repScore,
    });
  }
  const repToneValue =
    waveRep !== null && waveRep !== undefined ? waveRep.total_rep : null;
  const showLabels = !isInlineSidebarVariant(variant);
  const showHeaderSeparators = isInlineHeaderVariant(variant);
  const inlineSidebarTooltipId = isInlineSidebarVariant(variant)
    ? tooltipId
    : undefined;
  const shouldUseInlineSidebarTooltip =
    inlineSidebarTooltipId !== undefined && mode !== "summary";
  const hasVisibilityScore = visibilityScore !== null;
  const hasHotnessScore = hotnessScore !== null;
  const hasRepScore = repScore !== null;
  const showVisibilitySeparator =
    showHeaderSeparators &&
    hasVisibilityScore &&
    (hasHotnessScore || hasRepScore);
  const showHotnessSeparator =
    showHeaderSeparators && hasHotnessScore && hasRepScore;

  if (!hasVisibilityScore && !hasHotnessScore && !hasRepScore) {
    return null;
  }

  const containerClasses = getContainerClasses(variant, mode, className);

  if (mode === "summary") {
    if (visibilityScore === null) {
      return null;
    }

    const summaryDetails = buildSummaryDetails({
      visibilityScore,
      qualityScore,
      hotnessScore,
      repSortScore,
      waveRep,
    });
    const hasRichTooltip =
      learnMoreHref !== undefined || isInlineSidebarVariant(variant);
    const hasNativeTitle = !hasRichTooltip && !isSidebarVariant(variant);
    const summaryLabel = summaryDetails.join(". ");
    const summaryTitle = hasNativeTitle ? summaryDetails.join("\n") : undefined;
    const summaryTooltip = summaryDetails.join(" | ");
    const summaryChipClasses = getChipClasses(
      variant,
      mode,
      getVisibilityToneClasses(variant, waveScore?.visibility_score)
    );
    const summaryButtonResetClasses = isInlineHeaderVariant(variant)
      ? "tw-bg-transparent"
      : isInlineSidebarVariant(variant)
        ? "tw-bg-transparent tw-p-0"
        : "";
    const summaryButtonAffordanceClasses = isInlineSidebarVariant(variant)
      ? "tw-rounded-sm desktop-hover:hover:tw-bg-white/[0.04]"
      : "";
    const showSummaryLabel = !isInlineSidebarVariant(variant);
    const summaryChipContent = (
      <>
        <ShieldCheckIcon
          className={getIconClasses(variant)}
          strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
          aria-hidden="true"
        />
        {showSummaryLabel && (
          <span className={getChipLabelClasses(variant)}>
            {t(WAVE_TRUST_LOCALE, "waves.score.details.scoreLabel")}
          </span>
        )}
        <span className={getValueClasses(variant)}>{visibilityScore}</span>
      </>
    );
    const inlineSidebarTooltipAttributes = shouldUseInlineSidebarTooltip
      ? getTooltipAttributes(inlineSidebarTooltipId, summaryTooltip)
      : {};

    return renderContainer({
      variant,
      className: containerClasses,
      children: (
        <>
          {hasRichTooltip ? (
            <WaveScoreSummaryHoverCard
              learnMoreHref={learnMoreHref}
              triggerDisplay={
                isInlineSidebarVariant(variant) ? "inline-flex" : undefined
              }
              waveRep={waveRep}
              waveScore={waveScore}
            >
              <button
                type="button"
                className={`${summaryChipClasses} tw-border-0 tw-font-[inherit] tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${summaryButtonResetClasses} ${summaryButtonAffordanceClasses}`}
                aria-label={summaryLabel}
              >
                {summaryChipContent}
              </button>
            </WaveScoreSummaryHoverCard>
          ) : (
            <span
              className={summaryChipClasses}
              aria-label={summaryLabel}
              title={summaryTitle}
              {...inlineSidebarTooltipAttributes}
            >
              {summaryChipContent}
            </span>
          )}
        </>
      ),
    });
  }

  const visibilityDetails =
    visibilityScore === null
      ? []
      : buildSummaryDetails({
          visibilityScore,
          qualityScore,
          hotnessScore,
          repSortScore,
          waveRep,
        });
  const visibilityTitle = visibilityDetails.join("\n");
  const visibilityTooltip = visibilityDetails.join(" | ");
  const hotnessDetails =
    hotnessScore === null
      ? []
      : buildHotnessDetails({ hotnessScore, qualityScore });
  const hotnessTitle = hotnessDetails.join("\n");
  const hotnessTooltip = hotnessDetails.join(" | ");
  const repDetails =
    hasRepScore || repSortScore !== null
      ? buildRepDetails({ repSortScore, waveRep })
      : [];
  const repTitle = repDetails.join("\n");
  const repTooltip = repDetails.join(" | ");

  const signals = (
    <>
      {hasVisibilityScore && (
        <span
          className={getChipClasses(
            variant,
            mode,
            getVisibilityToneClasses(variant, waveScore?.visibility_score)
          )}
          aria-label={t(
            WAVE_TRUST_LOCALE,
            "waves.score.details.visibilityAria",
            {
              visibilityScore,
            }
          )}
          title={visibilityTitle}
          {...getTooltipAttributes(
            shouldUseInlineSidebarTooltip ? inlineSidebarTooltipId : undefined,
            visibilityTooltip
          )}
        >
          <ShieldCheckIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          {showLabels && (
            <span className={getChipLabelClasses(variant)}>
              {t(WAVE_TRUST_LOCALE, "waves.score.details.scoreLabel")}
            </span>
          )}
          <span className={getValueClasses(variant)}>{visibilityScore}</span>
        </span>
      )}
      {showVisibilitySeparator && (
        <span className={getSeparatorClasses(variant)} aria-hidden="true">
          &bull;
        </span>
      )}
      {hasHotnessScore && (
        <span
          className={getChipClasses(
            variant,
            mode,
            getHotnessToneClasses(variant)
          )}
          aria-label={t(WAVE_TRUST_LOCALE, "waves.score.details.hotnessAria", {
            hotnessScore: hotnessScore ?? "",
          })}
          title={hotnessTitle}
          {...getTooltipAttributes(
            shouldUseInlineSidebarTooltip ? inlineSidebarTooltipId : undefined,
            hotnessTooltip
          )}
        >
          <FireIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          {showLabels && (
            <span className={getChipLabelClasses(variant)}>
              {t(WAVE_TRUST_LOCALE, "waves.score.details.hotLabel")}
            </span>
          )}
          <span className={getValueClasses(variant)}>{hotnessScore}</span>
        </span>
      )}
      {showHotnessSeparator && (
        <span className={getSeparatorClasses(variant)} aria-hidden="true">
          &bull;
        </span>
      )}
      {hasRepScore && (
        <span
          className={getChipClasses(
            variant,
            mode,
            getRepToneClasses(repToneValue, variant)
          )}
          aria-label={repLabel ?? undefined}
          title={repTitle}
          {...getTooltipAttributes(
            shouldUseInlineSidebarTooltip ? inlineSidebarTooltipId : undefined,
            repTooltip
          )}
        >
          <ScaleIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          {showLabels && (
            <span className={getChipLabelClasses(variant)}>
              {t(WAVE_TRUST_LOCALE, "waves.score.details.repLabel")}
            </span>
          )}
          <span className={getValueClasses(variant)}>{repScore}</span>
        </span>
      )}
    </>
  );

  return renderContainer({
    variant,
    className: containerClasses,
    children: signals,
  });
}
