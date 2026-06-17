import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useId, type ReactNode } from "react";

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

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const fullNumberFormatter = new Intl.NumberFormat();
const WAVE_SCORE_FORMULA_HINT = "Open Network > Wave Score for the formula";

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

const isSidebarVariant = (variant: WaveTrustSignalsVariant): boolean =>
  variant === "sidebar" || isInlineSidebarVariant(variant);

const INLINE_STAT_TONE_CLASSES =
  "tw-text-[#e2e8f0]/[0.85] desktop-hover:hover:tw-text-[#e2e8f0]/[0.95]";

const getVisibilityToneClasses = (
  variant: WaveTrustSignalsVariant,
  value: number | null | undefined
): string => {
  const numericValue =
    value !== null && value !== undefined && Number.isFinite(value)
      ? value
      : null;

  if (isInlineSidebarVariant(variant)) {
    if (numericValue !== null && numericValue >= 85) {
      return "tw-text-emerald-300 desktop-hover:hover:tw-text-emerald-200";
    }
    if (numericValue !== null && numericValue >= 65) {
      return "tw-text-amber-300 desktop-hover:hover:tw-text-amber-200";
    }
    if (numericValue !== null && numericValue < 35) {
      return "tw-text-rose-300 desktop-hover:hover:tw-text-rose-200";
    }

    return INLINE_STAT_TONE_CLASSES;
  }

  if (isInlineHeaderVariant(variant)) {
    if (numericValue !== null && numericValue >= 85) {
      return "tw-text-emerald-400 desktop-hover:hover:tw-text-emerald-300";
    }
    if (numericValue !== null && numericValue >= 65) {
      return "tw-text-amber-400 desktop-hover:hover:tw-text-amber-300";
    }
    if (numericValue !== null && numericValue < 35) {
      return "tw-text-rose-400 desktop-hover:hover:tw-text-rose-300";
    }

    return "tw-text-primary-300 desktop-hover:hover:tw-text-[#A8C4FF]";
  }

  if (numericValue !== null && numericValue >= 85) {
    return "tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-emerald-400/25";
  }
  if (numericValue !== null && numericValue >= 65) {
    return "tw-bg-amber-500/10 tw-text-amber-200 tw-ring-amber-400/25";
  }
  if (numericValue !== null && numericValue < 35) {
    return "tw-bg-rose-500/10 tw-text-rose-200 tw-ring-rose-400/25";
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
      "tw-cursor-[inherit] tw-gap-[3px] tw-whitespace-nowrap tw-text-[11px] tw-font-semibold tw-leading-none";
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
  const details = [
    `Combined score: ${visibilityScore}`,
    "A quick signal for which waves deserve broad attention",
  ];

  if (qualityScore !== null) {
    details.push(`Quality: ${qualityScore} (65% of visibility)`);
  }

  if (hotnessScore !== null) {
    details.push(`Hotness: ${hotnessScore} (gated, 35% of visibility)`);
  }

  const rawRep = formatSignedFullNumber(waveRep?.total_rep);
  if (rawRep !== null && repSortScore !== null) {
    details.push(`REP: ${rawRep} raw, ${repSortScore} score`);
  } else if (rawRep !== null) {
    details.push(`REP: ${rawRep} raw`);
  } else if (repSortScore !== null) {
    details.push(`REP score: ${repSortScore}`);
  }

  details.push(WAVE_SCORE_FORMULA_HINT);

  return details;
};

const buildHotnessDetails = ({
  hotnessScore,
  qualityScore,
}: {
  readonly hotnessScore: string;
  readonly qualityScore: string | null;
}): string[] => {
  const details = [`Hotness score: ${hotnessScore}`];

  if (qualityScore !== null) {
    details.push(`Quality input: ${qualityScore} (35% of hotness)`);
  }

  details.push("Recent trusted activity carries the other 65%");
  details.push("Hotness is gated by quality before visibility");
  details.push(WAVE_SCORE_FORMULA_HINT);

  return details;
};

const buildRepDetails = ({
  repSortScore,
  waveRep,
}: {
  readonly repSortScore: string | null;
  readonly waveRep: ApiWaveRepSummary | null | undefined;
}): string[] => {
  const details: string[] = [];
  const rawRep = formatSignedFullNumber(waveRep?.total_rep);

  if (rawRep !== null) {
    details.push(`Wave REP: ${rawRep} raw`);
  }

  if (repSortScore !== null) {
    details.push(`REP score: ${repSortScore}`);
  }

  details.push("REP contributes 35% of quality");
  details.push(WAVE_SCORE_FORMULA_HINT);

  return details;
};

function WaveScoreSummaryTooltip({
  details,
  id,
  learnMoreHref,
}: {
  readonly details: readonly string[];
  readonly id: string;
  readonly learnMoreHref: string;
}) {
  const [primaryDetail, ...secondaryDetails] = details;

  return (
    <span
      id={id}
      role="tooltip"
      className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-full tw-z-50 tw-mt-2 tw-hidden tw-w-72 tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-left tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-200 tw-shadow-2xl tw-ring-1 tw-ring-white/10 group-hover:tw-block group-focus-within:tw-block"
    >
      {primaryDetail && (
        <span className="tw-block tw-text-sm tw-font-semibold tw-text-white">
          {primaryDetail}
        </span>
      )}
      <span className="tw-mt-2 tw-block tw-space-y-1.5">
        {secondaryDetails.map((detail) => (
          <span key={detail} className="tw-block tw-text-iron-300">
            {detail}
          </span>
        ))}
      </span>
      <Link
        href={learnMoreHref}
        className="tw-pointer-events-auto tw-mt-3 tw-inline-flex tw-items-center tw-rounded-md tw-bg-primary-500/15 tw-px-2 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-primary-200 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-primary-400/30 tw-transition hover:tw-bg-primary-500/25 hover:tw-text-primary-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
      >
        Learn how wave score works
      </Link>
    </span>
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
  const generatedTooltipId = useId();
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
    const richTooltipId = `${generatedTooltipId}-wave-score-tooltip`;
    const hasRichTooltip = learnMoreHref !== undefined;
    const hasNativeTitle = !hasRichTooltip && !isSidebarVariant(variant);
    const summaryLabel = summaryDetails.join(". ");
    const summaryTitle = hasNativeTitle ? summaryDetails.join("\n") : undefined;
    const summaryTooltip = summaryDetails.join(" | ");

    return renderContainer({
      variant,
      className: containerClasses,
      children: (
        <span
          className={`${getChipClasses(
            variant,
            mode,
            getVisibilityToneClasses(variant, waveScore?.visibility_score)
          )} ${
            hasRichTooltip
              ? "tw-group tw-relative tw-isolate tw-overflow-visible"
              : ""
          }`}
          aria-label={summaryLabel}
          aria-describedby={hasRichTooltip ? richTooltipId : undefined}
          tabIndex={hasRichTooltip ? 0 : undefined}
          title={summaryTitle}
          {...(hasRichTooltip || !shouldUseInlineSidebarTooltip
            ? {}
            : getTooltipAttributes(inlineSidebarTooltipId, summaryTooltip))}
        >
          <ShieldCheckIcon
            className={getIconClasses(variant)}
            strokeWidth={isInlineVariant(variant) ? 1.5 : undefined}
            aria-hidden="true"
          />
          <span className={getChipLabelClasses(variant)}>Score</span>
          <span className={getValueClasses(variant)}>{visibilityScore}</span>
          {hasRichTooltip && (
            <WaveScoreSummaryTooltip
              id={richTooltipId}
              details={summaryDetails}
              learnMoreHref={learnMoreHref}
            />
          )}
        </span>
      ),
    });
  }

  const visibilityDetails =
    visibilityScore !== null
      ? buildSummaryDetails({
          visibilityScore,
          qualityScore,
          hotnessScore,
          repSortScore,
          waveRep,
        })
      : [];
  const visibilityTitle = visibilityDetails.join("\n");
  const visibilityTooltip = visibilityDetails.join(" | ");
  const hotnessDetails =
    hotnessScore !== null
      ? buildHotnessDetails({ hotnessScore, qualityScore })
      : [];
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
          aria-label={`Visibility score ${visibilityScore} out of 100`}
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
