import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import {
  WAVE_TRUST_LOCALE,
  buildHotnessDetails,
  buildRepDetails,
  buildSummaryDetails,
  formatRepAccessibleValue,
  formatScore,
  getChipClasses,
  getChipLabelClasses,
  getContainerClasses,
  getHotnessToneClasses,
  getIconClasses,
  getRepScore,
  getRepToneClasses,
  getSeparatorClasses,
  getTooltipAttributes,
  getValueClasses,
  getVisibilityToneClasses,
  isInlineHeaderVariant,
  isInlineSidebarVariant,
  isInlineVariant,
  isSidebarVariant,
  WaveScoreSummaryHoverCard,
  type WaveTrustSignalsProps,
  type WaveTrustSignalsVariant,
} from "./WaveTrustSignals.shared";

export {
  hasWaveTrustSummaryScore,
  WaveScoreSummaryHoverCard,
} from "./WaveTrustSignals.shared";

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
