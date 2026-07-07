"use client";

import { useEffect, useRef, useState } from "react";

import { WaveTrustSignals } from "@/components/waves/WaveTrustSignals";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  ArrowLongRightIcon,
  CameraIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import {
  buildWaveScoreMarkdown,
  getClipboardNavigator,
  getShareStatusMessage,
  getWaveScoreScreenshotName,
  SHARE_STATUS,
  type ShareStatus,
} from "./shareUtils";
import {
  ConstantStat,
  FormulaResultPanel,
  MiniEquation,
  PenaltyStat,
  ScoreStat,
  WeightedRow,
} from "./WaveScoreResultStats";
import {
  buildQualityRows,
  calculateWeightedTotal,
  formatCompact,
  formatDaysFromMs,
  formatInteger,
  formatScore,
  formatScoreMismatch,
  formatTimestamp,
  formatWeight,
  getFormula,
  getQualityGate,
  getRepComponentFormula,
  getScoreReconciliationMismatches,
  getWaveDisplayHandle,
  getWaveHref,
  hasFormulaMetadata,
  roundScore,
  toNumber,
} from "./scoreUtils";

export function WaveScoreResult({ wave }: { readonly wave: ApiWave }) {
  const score = wave.wave_score;
  const waveHref = getWaveHref(wave);
  const analysisRef = useRef<HTMLElement>(null);
  const shareStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [shareStatus, setShareStatus] = useState<ShareStatus>(
    SHARE_STATUS.IDLE
  );

  useEffect(() => {
    return () => {
      if (shareStatusTimerRef.current) {
        clearTimeout(shareStatusTimerRef.current);
      }
    };
  }, []);

  const setTemporaryShareStatus = (nextStatus: ShareStatus) => {
    setShareStatus(nextStatus);
    if (shareStatusTimerRef.current) {
      clearTimeout(shareStatusTimerRef.current);
    }
    if (nextStatus !== SHARE_STATUS.SCREENSHOT_LOADING) {
      shareStatusTimerRef.current = setTimeout(() => {
        setShareStatus(SHARE_STATUS.IDLE);
      }, 3000);
    }
  };

  if (!score) {
    return (
      <section className="tw-rounded-lg tw-bg-iron-950/70 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
        <h2 className="tw-text-lg tw-font-semibold tw-text-white">
          {wave.name}
        </h2>
        <p className="tw-mt-2 tw-text-sm tw-text-iron-400">
          This wave loaded, but the API did not return a score yet.
        </p>
      </section>
    );
  }

  const formula = getFormula(score);
  const gate = getQualityGate(score);
  const qualityRows = buildQualityRows(score);
  const qualityBeforeSafety = roundScore(calculateWeightedTotal(qualityRows));
  const safetyMultiplier = toNumber(score.penalties.safety_multiplier, 1);
  const computedQuality = roundScore(qualityBeforeSafety * safetyMultiplier);
  const hotnessBeforeSafety = roundScore(
    toNumber(score.components.recent_trusted_activity_score) *
      toNumber(
        formula.hotness_component_weights.recent_trusted_activity_score
      ) +
      toNumber(score.quality_score) *
        toNumber(formula.hotness_component_weights.quality_score)
  );
  const computedHotness = roundScore(hotnessBeforeSafety * safetyMultiplier);
  const computedVisibility = roundScore(
    toNumber(score.quality_score) *
      toNumber(formula.visibility_component_weights.quality_score) +
      toNumber(gate.gated_hotness_score) *
        toNumber(formula.visibility_component_weights.gated_hotness_score)
  );
  const waveRepTotal = wave.wave_rep?.total_rep ?? 0;
  const hasScoreFormulaMetadata = hasFormulaMetadata(score);
  const formulaSource = hasScoreFormulaMetadata
    ? "API formula metadata"
    : "v1 fallback";
  const fallbackReconciliationDetail =
    "API score shown; no formula metadata returned";
  const scoreMismatches = hasScoreFormulaMetadata
    ? getScoreReconciliationMismatches([
        {
          label: "Quality",
          apiScore: score.quality_score,
          computedScore: computedQuality,
        },
        {
          label: "Hotness",
          apiScore: score.hotness_score,
          computedScore: computedHotness,
        },
        {
          label: "Visibility",
          apiScore: score.visibility_score,
          computedScore: computedVisibility,
        },
      ])
    : [];
  const scoreMismatchDetail = scoreMismatches
    .map(formatScoreMismatch)
    .join("; ");
  const markdownAnalysis = buildWaveScoreMarkdown({
    wave,
    waveHref,
    score,
    formula,
    gate,
    qualityRows,
    qualityBeforeSafety,
    safetyMultiplier,
    computedQuality,
    hotnessBeforeSafety,
    computedHotness,
    computedVisibility,
    waveRepTotal,
    formulaSource,
    scoreMismatchDetail,
  });

  const handleCopyMarkdown = async () => {
    try {
      const clipboard = getClipboardNavigator()?.clipboard;
      if (typeof clipboard?.writeText !== "function") {
        throw new TypeError("Clipboard API unavailable");
      }
      await clipboard.writeText(markdownAnalysis);
      setTemporaryShareStatus(SHARE_STATUS.COPIED);
    } catch (copyError) {
      console.error("Wave score markdown copy failed", copyError);
      setTemporaryShareStatus(SHARE_STATUS.COPY_ERROR);
    }
  };

  const handleDownloadScreenshot = async () => {
    const analysisNode = analysisRef.current;
    if (!analysisNode) {
      setTemporaryShareStatus(SHARE_STATUS.SCREENSHOT_ERROR);
      return;
    }

    setShareStatus(SHARE_STATUS.SCREENSHOT_LOADING);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(analysisNode, {
        backgroundColor: "#050505",
        cacheBust: true,
        pixelRatio: 2,
        filter: (node) =>
          !(
            node instanceof HTMLElement &&
            node.dataset["waveScoreScreenshotExclude"] === "true"
          ),
      });
      const link = globalThis.document.createElement("a");
      link.href = dataUrl;
      link.download = getWaveScoreScreenshotName(wave.name);
      globalThis.document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
      setTemporaryShareStatus(SHARE_STATUS.SCREENSHOT_READY);
    } catch (screenshotError) {
      console.error("Wave score screenshot failed", screenshotError);
      setTemporaryShareStatus(SHARE_STATUS.SCREENSHOT_ERROR);
    }
  };

  return (
    <section ref={analysisRef} className="tw-space-y-5" aria-live="polite">
      <div className="tw-rounded-lg tw-bg-iron-950/70 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
        <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
          <div className="tw-min-w-0">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <h2 className="tw-break-words tw-text-xl tw-font-semibold tw-text-white">
                {wave.name}
              </h2>
              <span className="tw-rounded-md tw-bg-black/35 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-white/10">
                {score.score_version}
              </span>
            </div>
            <p className="tw-mt-2 tw-text-sm tw-text-iron-400">
              Created by {getWaveDisplayHandle(wave)}. Score calculated{" "}
              {formatTimestamp(score.calculated_at)}.
            </p>
            {scoreMismatches.length > 0 && (
              <output className="tw-mt-4 tw-rounded-lg tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-text-amber-100 tw-ring-1 tw-ring-inset tw-ring-amber-400/25">
                <p className="tw-font-semibold">Formula drift detected</p>
                <p className="tw-mt-1 tw-text-amber-100/85">
                  {scoreMismatchDetail}
                </p>
              </output>
            )}
            <WaveTrustSignals
              waveRep={wave.wave_rep ?? null}
              waveScore={score}
              className="tw-mt-4"
            />
          </div>
          <div
            data-wave-score-screenshot-exclude="true"
            className="tw-flex tw-flex-col tw-items-stretch tw-gap-2 sm:tw-flex-row lg:tw-items-start"
          >
            <button
              type="button"
              onClick={() => void handleCopyMarkdown()}
              className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-white/5 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/10"
              aria-label="Copy wave score analysis as Markdown"
            >
              <ClipboardDocumentIcon className="tw-size-4" aria-hidden="true" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadScreenshot()}
              disabled={shareStatus === SHARE_STATUS.SCREENSHOT_LOADING}
              className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-white/5 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-bg-white/10"
              aria-label="Download wave score analysis screenshot"
            >
              <CameraIcon className="tw-size-4" aria-hidden="true" />
              Screenshot
            </button>
            <Link
              href={waveHref}
              className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-white/5 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/10"
            >
              Open wave
              <ArrowLongRightIcon className="tw-size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <output
          data-wave-score-screenshot-exclude="true"
          aria-live="polite"
          className="tw-mt-3 tw-min-h-5 tw-text-xs tw-font-medium tw-text-iron-300"
        >
          {getShareStatusMessage(shareStatus)}
        </output>

        <div className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
          <ScoreStat
            label="Visibility"
            value={score.visibility_score}
            icon={SparklesIcon}
            toneClass="tw-bg-violet-400"
          />
          <ScoreStat
            label="Quality"
            value={score.quality_score}
            icon={ShieldCheckIcon}
            toneClass="tw-bg-sky-400"
          />
          <ScoreStat
            label="Hotness"
            value={score.hotness_score}
            icon={FireIcon}
            toneClass="tw-bg-amber-400"
          />
          <ScoreStat
            label="REP component"
            value={score.components.wave_rep_component_score}
            icon={ScaleIcon}
            toneClass="tw-bg-fuchsia-400"
          />
        </div>
      </div>

      <div className="tw-grid tw-gap-5 xl:tw-grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <h3 className="tw-text-base tw-font-semibold tw-text-white">
              Quality calculation
            </h3>
            <span className="tw-rounded-md tw-bg-black/35 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-400">
              {formulaSource}
            </span>
          </div>
          <div className="tw-mt-4 tw-space-y-3">
            {qualityRows.map((row) => (
              <WeightedRow key={row.label} row={row} />
            ))}
          </div>
          <div className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-3">
            <MiniEquation
              label="Base quality"
              value={qualityBeforeSafety}
              detail="Weighted component sum"
            />
            <MiniEquation
              label="Safety multiplier"
              value={safetyMultiplier}
              detail="Penalty floor is 0.25"
            />
            <MiniEquation
              label="Quality"
              value={score.quality_score}
              detail={
                hasScoreFormulaMetadata
                  ? `Computed ${formatScore(computedQuality)}`
                  : fallbackReconciliationDetail
              }
            />
          </div>
        </div>

        <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
          <h3 className="tw-text-base tw-font-semibold tw-text-white">
            REP scale
          </h3>
          <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            Raw Wave REP remains TDH-sized. This wave has{" "}
            <span className="tw-font-semibold tw-text-white">
              {formatCompact(waveRepTotal)}
            </span>{" "}
            total REP, converted to a bounded score before it contributes 35% of
            quality.
          </p>
          <div className="tw-mt-4 tw-rounded-lg tw-bg-black/25 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-white/10">
            <p className="tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-200">
              {getRepComponentFormula(
                waveRepTotal,
                formula.max_wave_rep_for_score
              )}
            </p>
          </div>
          <div className="tw-mt-4 tw-grid tw-grid-cols-3 tw-gap-2">
            <MiniEquation
              label="Positive"
              value={wave.wave_rep?.positive_rep ?? 0}
              detail="raw REP"
            />
            <MiniEquation
              label="Negative"
              value={wave.wave_rep?.negative_rep ?? 0}
              detail="raw REP"
            />
            <MiniEquation
              label="Raters"
              value={wave.wave_rep?.contributor_count ?? 0}
              detail="profiles"
            />
          </div>
        </div>
      </div>

      <div className="tw-grid tw-gap-5 lg:tw-grid-cols-3">
        <FormulaResultPanel
          title="Hotness"
          icon={FireIcon}
          toneClasses="tw-bg-amber-500/10 tw-text-amber-200 tw-ring-amber-400/25"
          rows={[
            {
              label: "Recent trusted activity",
              value: score.components.recent_trusted_activity_score,
              detail: formatWeight(
                formula.hotness_component_weights.recent_trusted_activity_score
              ),
            },
            {
              label: "Quality",
              value: score.quality_score,
              detail: formatWeight(
                formula.hotness_component_weights.quality_score
              ),
            },
            {
              label: "Safety multiplier",
              value: safetyMultiplier,
              detail: "applied again",
            },
          ]}
          footer={
            hasScoreFormulaMetadata
              ? `Base ${formatScore(
                  hotnessBeforeSafety
                )} -> hotness ${formatScore(
                  score.hotness_score
                )}. Computed ${formatScore(computedHotness)}.`
              : "API hotness is shown without client reconciliation because this response did not include formula metadata."
          }
        />

        <FormulaResultPanel
          title="Quality gate"
          icon={ChartBarIcon}
          toneClasses="tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-emerald-400/25"
          rows={[
            {
              label: "Threshold",
              value: gate.threshold,
              detail: "quality needed",
            },
            {
              label: "Multiplier",
              value: gate.multiplier,
              detail: `clamp(${formatScore(score.quality_score)} / ${formatScore(
                gate.threshold
              )})`,
            },
            {
              label: "Gated hotness",
              value: gate.gated_hotness_score,
              detail: "hotness credit",
            },
          ]}
          footer="This is the anti-spam guard between hotness and final visibility."
        />

        <FormulaResultPanel
          title="Visibility"
          icon={SparklesIcon}
          toneClasses="tw-bg-violet-500/10 tw-text-violet-200 tw-ring-violet-400/25"
          rows={[
            {
              label: "Quality",
              value: score.quality_score,
              detail: formatWeight(
                formula.visibility_component_weights.quality_score
              ),
            },
            {
              label: "Gated hotness",
              value: gate.gated_hotness_score,
              detail: formatWeight(
                formula.visibility_component_weights.gated_hotness_score
              ),
            },
            {
              label: "Tier",
              value: score.visibility_score,
              detail: score.visibility_tier,
            },
          ]}
          footer={
            hasScoreFormulaMetadata
              ? `Final visibility ${formatScore(
                  score.visibility_score
                )}. Computed ${formatScore(computedVisibility)}.`
              : "API visibility is shown without client reconciliation because this response did not include formula metadata."
          }
        />
      </div>

      <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
        <h3 className="tw-text-base tw-font-semibold tw-text-white">
          Penalty detail
        </h3>
        <p className="tw-mt-2 tw-text-sm tw-text-iron-400">
          These are percentage penalties stored with the wave score. Cross-post
          pressure is exposed separately so users can see when repeated mentions
          are pushing against visibility.
        </p>
        <div className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-5">
          <PenaltyStat
            label="Single actor"
            value={score.penalties.single_actor_penalty}
          />
          <PenaltyStat
            label="Low trust flood"
            value={score.penalties.low_trust_flood_penalty}
          />
          <PenaltyStat
            label="Cross-post pressure"
            value={score.penalties.cross_post_pressure}
          />
          <PenaltyStat
            label="Cross-post penalty"
            value={score.penalties.cross_post_penalty}
          />
          <PenaltyStat
            label="Negative REP"
            value={score.penalties.negative_rep_penalty}
          />
        </div>
      </div>

      <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
        <h3 className="tw-text-base tw-font-semibold tw-text-white">
          Formula constants
        </h3>
        <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          These API-returned constants explain the curve shapes, recency decay,
          and visibility tier cutoffs behind the stored scores.
        </p>
        <div className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
          <ConstantStat
            label="Recent window"
            value={formatDaysFromMs(formula.recent_activity_window_ms)}
            detail="trusted activity considered recent"
          />
          <ConstantStat
            label="Recent half-life"
            value={formatDaysFromMs(formula.recent_activity_half_life_ms)}
            detail="recency multiplier decay"
          />
          <ConstantStat
            label="Post saturation"
            value={formatInteger(formula.participation_saturation_scale)}
            detail="level-weighted posts"
          />
          <ConstantStat
            label="Activity saturation"
            value={formatInteger(formula.recent_activity_saturation_scale)}
            detail="recent trusted activity"
          />
          <ConstantStat
            label="Diversity saturation"
            value={formatInteger(formula.trusted_diversity_saturation_scale)}
            detail="trusted authors"
          />
          <ConstantStat
            label="Subscription saturation"
            value={formatInteger(formula.trusted_subscription_saturation_scale)}
            detail="trusted subscribers"
          />
          <ConstantStat
            label="Trusted tier"
            value={formatScore(formula.trusted_visible_min_visibility_score)}
            detail="minimum visibility score"
          />
          <ConstantStat
            label="Neutral tier"
            value={formatScore(
              formula.exploration_neutral_min_visibility_score
            )}
            detail="exploration threshold"
          />
        </div>
      </div>
    </section>
  );
}
