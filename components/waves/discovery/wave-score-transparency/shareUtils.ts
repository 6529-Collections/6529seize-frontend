import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import type { ApiWaveScoreFormula } from "@/generated/models/ApiWaveScoreFormula";
import type { ApiWaveScoreQualityGate } from "@/generated/models/ApiWaveScoreQualityGate";

import {
  formatInteger,
  formatScore,
  formatTimestamp,
  formatWeight,
  getCurrentOrigin,
  getWaveDisplayHandle,
} from "./scoreUtils";
import type { CalculationRow } from "./types";

export const SHARE_STATUS = {
  IDLE: "idle",
  COPIED: "copied",
  COPY_ERROR: "copy-error",
  SCREENSHOT_LOADING: "screenshot-loading",
  SCREENSHOT_READY: "screenshot-ready",
  SCREENSHOT_ERROR: "screenshot-error",
} as const;

export type ShareStatus = (typeof SHARE_STATUS)[keyof typeof SHARE_STATUS];

type OptionalClipboardNavigator = {
  readonly clipboard?: {
    readonly writeText?: (text: string) => Promise<void>;
  };
};

export const getClipboardNavigator = ():
  | OptionalClipboardNavigator
  | undefined => {
  if (globalThis.window !== undefined) {
    return globalThis.window.navigator as OptionalClipboardNavigator;
  }
  return globalThis.navigator as OptionalClipboardNavigator | undefined;
};

export function getShareStatusMessage(status: ShareStatus): string {
  switch (status) {
    case SHARE_STATUS.COPIED:
      return "Markdown analysis copied.";
    case SHARE_STATUS.COPY_ERROR:
      return "Unable to copy the analysis.";
    case SHARE_STATUS.SCREENSHOT_LOADING:
      return "Preparing screenshot.";
    case SHARE_STATUS.SCREENSHOT_READY:
      return "Screenshot downloaded.";
    case SHARE_STATUS.SCREENSHOT_ERROR:
      return "Unable to create the screenshot.";
    case SHARE_STATUS.IDLE:
      return "";
  }
}

export function getWaveScoreScreenshotName(waveName: string): string {
  const slugCharacters: string[] = [];
  let lastWasSeparator = true;

  for (const character of waveName.toLowerCase()) {
    const codePoint = character.codePointAt(0) ?? 0;
    const isDigit = codePoint >= 48 && codePoint <= 57;
    const isLowercaseLetter = codePoint >= 97 && codePoint <= 122;

    if (isDigit || isLowercaseLetter) {
      slugCharacters.push(character);
      lastWasSeparator = false;
    } else if (!lastWasSeparator && slugCharacters.length < 48) {
      slugCharacters.push("-");
      lastWasSeparator = true;
    }

    if (slugCharacters.length >= 48) {
      break;
    }
  }

  if (slugCharacters.at(-1) === "-") {
    slugCharacters.pop();
  }

  const slug = slugCharacters.join("");
  return `${slug || "wave"}-score-analysis.png`;
}

export function buildWaveScoreMarkdown({
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
}: {
  readonly wave: ApiWave;
  readonly waveHref: string;
  readonly score: ApiWaveScore;
  readonly formula: ApiWaveScoreFormula;
  readonly gate: ApiWaveScoreQualityGate;
  readonly qualityRows: readonly CalculationRow[];
  readonly qualityBeforeSafety: number;
  readonly safetyMultiplier: number;
  readonly computedQuality: number;
  readonly hotnessBeforeSafety: number;
  readonly computedHotness: number;
  readonly computedVisibility: number;
  readonly waveRepTotal: number;
  readonly formulaSource: string;
  readonly scoreMismatchDetail: string;
}): string {
  const qualityLines = qualityRows.map((row) => {
    const contribution = row.score * row.weight;
    return `- ${row.label}: ${formatScore(row.score)} x ${formatWeight(
      row.weight
    )} = ${formatScore(contribution)}`;
  });
  const mismatchLines = scoreMismatchDetail
    ? ["", `Formula drift: ${scoreMismatchDetail}`]
    : [];

  return [
    `# Wave score analysis: ${wave.name}`,
    "",
    `Wave: ${getCurrentOrigin()}${waveHref}`,
    `Creator: ${getWaveDisplayHandle(wave)}`,
    `Calculated: ${formatTimestamp(score.calculated_at)}`,
    `Version: ${score.score_version}`,
    `Formula source: ${formulaSource}`,
    "",
    "## Scores",
    `- Visibility: ${formatScore(score.visibility_score)} (${score.visibility_tier})`,
    `- Quality: ${formatScore(score.quality_score)}`,
    `- Hotness: ${formatScore(score.hotness_score)}`,
    `- Wave REP: ${formatInteger(waveRepTotal)} raw -> ${formatScore(
      score.components.wave_rep_component_score
    )} component`,
    ...mismatchLines,
    "",
    "## Quality",
    ...qualityLines,
    `- Base quality: ${formatScore(qualityBeforeSafety)}`,
    `- Safety multiplier: ${formatScore(safetyMultiplier)}`,
    `- Final quality: ${formatScore(score.quality_score)} (computed ${formatScore(
      computedQuality
    )})`,
    "",
    "## Hotness and visibility",
    `- Recent trusted activity: ${formatScore(
      score.components.recent_trusted_activity_score
    )} x ${formatWeight(
      formula.hotness_component_weights.recent_trusted_activity_score
    )}`,
    `- Quality in hotness: ${formatScore(
      score.quality_score
    )} x ${formatWeight(formula.hotness_component_weights.quality_score)}`,
    `- Base hotness: ${formatScore(hotnessBeforeSafety)}`,
    `- Final hotness: ${formatScore(score.hotness_score)} (computed ${formatScore(
      computedHotness
    )})`,
    `- Quality gate: clamp(${formatScore(score.quality_score)} / ${formatScore(
      gate.threshold
    )}, 0, 1) = ${formatScore(gate.multiplier)}`,
    `- Gated hotness: ${formatScore(gate.gated_hotness_score)}`,
    `- Visibility: quality x ${formatWeight(
      formula.visibility_component_weights.quality_score
    )} + gated hotness x ${formatWeight(
      formula.visibility_component_weights.gated_hotness_score
    )} = ${formatScore(score.visibility_score)} (computed ${formatScore(
      computedVisibility
    )})`,
    "",
    "## Penalties",
    `- Single actor: ${formatScore(score.penalties.single_actor_penalty)}%`,
    `- Low trust flood: ${formatScore(score.penalties.low_trust_flood_penalty)}%`,
    `- Cross-post pressure: ${formatScore(score.penalties.cross_post_pressure)}%`,
    `- Cross-post penalty: ${formatScore(score.penalties.cross_post_penalty)}%`,
    `- Negative REP: ${formatScore(score.penalties.negative_rep_penalty)}%`,
    "",
    `Formula page: ${getCurrentOrigin()}/network/wave-score`,
  ].join("\n");
}
