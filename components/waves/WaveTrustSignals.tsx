import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

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
}

interface WaveScoreTooltipMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const fullNumberFormatter = new Intl.NumberFormat();

const formatScore = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return `${Math.round(value)}`;
};

const formatRep = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  if (value > 0) {
    return `+${compactNumberFormatter.format(value)}`;
  }

  return compactNumberFormatter.format(value);
};

const formatSignedFullNumber = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const formatted = fullNumberFormatter.format(Math.abs(value));
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

  const formatted = fullNumberFormatter.format(Math.abs(value));
  if (value > 0) {
    return `positive ${formatted}`;
  }
  if (value < 0) {
    return `negative ${formatted}`;
  }
  return formatted;
};

const isInlineSidebarVariant = (variant: WaveTrustSignalsVariant): boolean =>
  variant === "sidebar-inline";

const isInlineHeaderVariant = (variant: WaveTrustSignalsVariant): boolean =>
  variant === "header-inline";

const isInlineVariant = (variant: WaveTrustSignalsVariant): boolean =>
  isInlineSidebarVariant(variant) || isInlineHeaderVariant(variant);

const INLINE_STAT_TONE_CLASSES =
  "tw-text-[#e2e8f0]/[0.85] desktop-hover:hover:tw-text-[#e2e8f0]/[0.95]";

const getVisibilityToneClasses = (variant: WaveTrustSignalsVariant): string => {
  if (isInlineSidebarVariant(variant)) {
    return INLINE_STAT_TONE_CLASSES;
  }

  if (isInlineHeaderVariant(variant)) {
    return "tw-text-primary-300 desktop-hover:hover:tw-text-[#A8C4FF]";
  }

  return "tw-bg-sky-500/10 tw-text-sky-200 tw-ring-sky-400/25";
};

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
    baseClasses = "tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-1.5";
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
      "tw-cursor-default tw-gap-1 tw-whitespace-nowrap tw-text-[11px] tw-font-semibold tw-leading-none";
    sizeClasses = "";
  } else if (variant === "sidebar") {
    sizeClasses = "tw-h-5 tw-px-1.5 tw-text-[10px]";
  }

  let summaryClasses = "";
  if (mode === "summary") {
    summaryClasses = "tw-shrink-0 tw-justify-center";
    if (variant === "sidebar" || isInlineSidebarVariant(variant)) {
      summaryClasses = `${summaryClasses} tw-w-[4.75rem]`;
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
    return "";
  }

  if (isInlineHeaderVariant(variant)) {
    return "tw-text-[11px] tw-font-semibold";
  }

  return "";
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

export const hasWaveTrustSignals = ({
  waveRep,
  waveScore,
}: {
  readonly waveRep?: ApiWaveRepSummary | null | undefined;
  readonly waveScore?: ApiWaveScore | null | undefined;
}): boolean => {
  const visibilityScore = formatScore(waveScore?.visibility_score);
  const hotnessScore = formatScore(waveScore?.hotness_score);
  const repScore = getRepScore({ waveRep, waveScore });

  return visibilityScore !== null || hotnessScore !== null || repScore !== null;
};

export const hasWaveTrustSummaryScore = (
  waveScore?: ApiWaveScore | null | undefined
): boolean => formatScore(waveScore?.visibility_score) !== null;

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
}) => {
  const details = [`Combined score: ${visibilityScore}`];

  if (qualityScore !== null) {
    details.push(`Quality: ${qualityScore}`);
  }

  if (hotnessScore !== null) {
    details.push(`Hotness: ${hotnessScore}`);
  }

  const rawRep = formatSignedFullNumber(waveRep?.total_rep);
  if (rawRep !== null && repSortScore !== null) {
    details.push(`REP: ${rawRep} raw, ${repSortScore} score`);
  } else if (rawRep !== null) {
    details.push(`REP: ${rawRep} raw`);
  } else if (repSortScore !== null) {
    details.push(`REP score: ${repSortScore}`);
  }

  return details;
};

const buildSummaryMetrics = ({
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
}): WaveScoreTooltipMetric[] => {
  const metrics: WaveScoreTooltipMetric[] = [
    {
      label: "Score",
      value: `${visibilityScore}/100`,
      detail: "Final visibility ranking",
    },
  ];

  if (qualityScore !== null) {
    metrics.push({
      label: "Quality",
      value: `${qualityScore}/100`,
      detail: "Durable trust and participation",
    });
  }

  if (hotnessScore !== null) {
    metrics.push({
      label: "Hotness",
      value: `${hotnessScore}/100`,
      detail: "Recent trusted activity",
    });
  }

  const rawRep = formatSignedFullNumber(waveRep?.total_rep);
  if (rawRep !== null && repSortScore !== null) {
    metrics.push({
      label: "REP",
      value: rawRep,
      detail: `${repSortScore}/100 score contribution`,
    });
  } else if (rawRep !== null) {
    metrics.push({
      label: "REP",
      value: rawRep,
      detail: "Raw wave reputation",
    });
  } else if (repSortScore !== null) {
    metrics.push({
      label: "REP",
      value: `${repSortScore}/100`,
      detail: "Reputation score contribution",
    });
  }

  return metrics;
};

const WaveScoreInfoCard = ({
  metrics,
}: {
  readonly metrics: readonly WaveScoreTooltipMetric[];
}) => (
  <div className="tw-w-[15rem] tw-max-w-[calc(100vw-2rem)]">
    <div className="tw-flex tw-items-center tw-gap-2">
      <div className="tw-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-sky-400/10 tw-text-sky-200 tw-ring-1 tw-ring-inset tw-ring-sky-300/20">
        <ShieldCheckIcon className="tw-size-3.5" aria-hidden="true" />
      </div>
      <div className="tw-min-w-0">
        <div className="tw-text-xs tw-font-semibold tw-leading-4 tw-text-white">
          Wave score
        </div>
        <div className="tw-mt-0.5 tw-text-[10px] tw-font-medium tw-leading-3 tw-text-iron-400">
          Signals used to rank trusted active waves.
        </div>
      </div>
    </div>
    <div className="tw-mt-2.5 tw-space-y-1.5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="tw-flex tw-items-start tw-justify-between tw-gap-3"
        >
          <div className="tw-min-w-0">
            <div className="tw-text-[11px] tw-font-semibold tw-leading-[14px] tw-text-iron-100">
              {metric.label}
            </div>
            <div className="tw-mt-0.5 tw-text-[10px] tw-font-medium tw-leading-3 tw-text-iron-500">
              {metric.detail}
            </div>
          </div>
          <div className="tw-flex-shrink-0 tw-rounded tw-bg-white/[0.04] tw-px-1.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-white/[0.07]">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
    repLabel = `Wave REP ${repAccessibleValue}`;
  }
  if (!hasRepSummary && repScore !== null) {
    repLabel = `Wave REP score ${repScore} out of 100`;
  }
  const repToneValue =
    waveRep !== null && waveRep !== undefined ? waveRep.total_rep : null;
  const showLabels = !isInlineSidebarVariant(variant);
  const showHeaderSeparators = isInlineHeaderVariant(variant);
  const inlineSidebarTooltipId = isInlineSidebarVariant(variant)
    ? tooltipId
    : undefined;
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
    const summaryMetrics = buildSummaryMetrics({
      visibilityScore,
      qualityScore,
      hotnessScore,
      repSortScore,
      waveRep,
    });
    const summaryLabel = summaryDetails.join(". ");
    const summaryTitle = summaryDetails.join("\n");
    const summaryTooltip = summaryDetails.join(" | ");
    const summaryChipClasses = getChipClasses(
      variant,
      mode,
      getVisibilityToneClasses(variant)
    );
    const summaryChipChildren = (
      <>
        <ShieldCheckIcon
          className={getIconClasses(variant)}
          strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
          aria-hidden="true"
        />
        <span className={getChipLabelClasses(variant)}>Score</span>
        <span className={getValueClasses(variant)}>{visibilityScore}</span>
      </>
    );

    if (isInlineSidebarVariant(variant)) {
      return renderContainer({
        variant,
        className: containerClasses,
        children: (
          <HoverCard
            ariaLabel="Wave score details"
            content={<WaveScoreInfoCard metrics={summaryMetrics} />}
            delayShow={250}
            offset={10}
            openOnClick
            placement="auto"
          >
            <button
              type="button"
              className={`${summaryChipClasses} tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.04] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300`}
              aria-label={`Show wave score details. ${summaryLabel}`}
              title={summaryTitle}
            >
              {summaryChipChildren}
            </button>
          </HoverCard>
        ),
      });
    }

    return renderContainer({
      variant,
      className: containerClasses,
      children: (
        <span
          className={summaryChipClasses}
          aria-label={summaryLabel}
          title={summaryTitle}
          {...getTooltipAttributes(inlineSidebarTooltipId, summaryTooltip)}
        >
          {summaryChipChildren}
        </span>
      ),
    });
  }

  const signals = (
    <>
      {hasVisibilityScore && (
        <span
          className={getChipClasses(
            variant,
            mode,
            getVisibilityToneClasses(variant)
          )}
          aria-label={`Visibility score ${visibilityScore} out of 100`}
          {...getTooltipAttributes(inlineSidebarTooltipId, "Score")}
        >
          <ShieldCheckIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          {showLabels && (
            <span className={getChipLabelClasses(variant)}>Score</span>
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
          aria-label={`Hotness score ${hotnessScore} out of 100`}
          {...getTooltipAttributes(inlineSidebarTooltipId, "Hot")}
        >
          <FireIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          {showLabels && (
            <span className={getChipLabelClasses(variant)}>Hot</span>
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
          {...getTooltipAttributes(inlineSidebarTooltipId, "REP")}
        >
          <ScaleIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          {showLabels && (
            <span className={getChipLabelClasses(variant)}>REP</span>
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
