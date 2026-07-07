import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import type { ApiWaveScoreFormula } from "@/generated/models/ApiWaveScoreFormula";
import type { ApiWaveScoreQualityGate } from "@/generated/models/ApiWaveScoreQualityGate";
import {
  getMessageIdFromPathname,
  getWaveIdFromPathname,
  getWaveRoute,
} from "@/helpers/navigation.helpers";
import { parseSeizeWaveLink } from "@/helpers/SeizeLinkParser";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChartBarIcon,
  FireIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import type { CalculationRow } from "./types";

interface FormulaStep {
  readonly label: string;
  readonly formula: string;
  readonly description: string;
  readonly icon: typeof ShieldCheckIcon;
  readonly toneClasses: string;
}

interface ScoreReconciliationMismatch {
  readonly label: string;
  readonly apiScore: number;
  readonly computedScore: number;
}

type ApiWaveScoreWithRuntimeOptionalMetadata = Omit<
  ApiWaveScore,
  "formula" | "quality_gate"
> & {
  readonly formula?: ApiWaveScoreFormula | null;
  readonly quality_gate?: ApiWaveScoreQualityGate | null;
};

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const SCORE_RECONCILIATION_EPSILON = 0.05;
export const DEFAULT_BACK_HREF = "/about";

const DEFAULT_FORMULA: ApiWaveScoreFormula = {
  max_level_raw_for_score: 25000000,
  max_wave_rep_for_score: 200000000,
  trusted_level_raw: 1000,
  low_trust_level_raw: 25,
  recent_activity_window_ms: 7 * 24 * 60 * 60 * 1000,
  recent_activity_half_life_ms: 2 * 24 * 60 * 60 * 1000,
  participation_saturation_scale: 600,
  trusted_diversity_saturation_scale: 8,
  trusted_subscription_saturation_scale: 30,
  recent_activity_saturation_scale: 250,
  trusted_visible_min_visibility_score: 55,
  exploration_neutral_min_visibility_score: 25,
  demoted_min_visibility_score: 10,
  quality_component_weights: {
    creator_score: 0.2,
    level_weighted_participation_score: 0.2,
    trusted_diversity_score: 0.15,
    trusted_subscription_score: 0.1,
    wave_rep_component_score: 0.35,
  },
  hotness_component_weights: {
    recent_trusted_activity_score: 0.65,
    quality_score: 0.35,
  },
  visibility_component_weights: {
    quality_score: 0.65,
    gated_hotness_score: 0.35,
  },
};

const DEFAULT_QUALITY_GATE_THRESHOLD = 25;

const scoreFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formulaSteps: readonly FormulaStep[] = [
  {
    label: "Quality",
    formula:
      "(creator x 20%) + (poster levels x 20%) + (diversity x 15%) + (subscriptions x 10%) + (REP x 35%)",
    description:
      "The durable trust score for evaluating a new wave. This is where TDH-backed Wave REP has the largest explicit weight.",
    icon: ShieldCheckIcon,
    toneClasses: "tw-bg-sky-500/10 tw-text-sky-200 tw-ring-sky-400/25",
  },
  {
    label: "Hotness",
    formula: "(recent trusted activity x 65%) + (quality x 35%)",
    description:
      "The momentum score. Recent level-weighted posting helps, but low-quality waves cannot ride activity alone.",
    icon: FireIcon,
    toneClasses: "tw-bg-amber-500/10 tw-text-amber-200 tw-ring-amber-400/25",
  },
  {
    label: "Quality Gate",
    formula: "clamp(quality / 25, 0, 1)",
    description:
      "A low-quality wave gets only partial hotness credit when visibility is calculated.",
    icon: ChartBarIcon,
    toneClasses:
      "tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-emerald-400/25",
  },
  {
    label: "Visibility",
    formula: "(quality x 65%) + (gated hotness x 35%)",
    description:
      "The final discovery score used for balanced wave ordering and visibility tiers.",
    icon: SparklesIcon,
    toneClasses: "tw-bg-violet-500/10 tw-text-violet-200 tw-ring-violet-400/25",
  },
];

export function toNumber(value: unknown, fallback = 0): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatScore(value: unknown): string {
  return scoreFormatter.format(roundScore(toNumber(value)));
}

export function getScoreReconciliationMismatches(
  scores: readonly ScoreReconciliationMismatch[]
): ScoreReconciliationMismatch[] {
  return scores.filter(
    ({ apiScore, computedScore }) =>
      Math.abs(apiScore - computedScore) > SCORE_RECONCILIATION_EPSILON
  );
}

export function formatScoreMismatch({
  label,
  apiScore,
  computedScore,
}: ScoreReconciliationMismatch): string {
  return `${label}: API ${formatScore(apiScore)}, computed ${formatScore(
    computedScore
  )}`;
}

export function formatCompact(value: unknown): string {
  const numericValue = toNumber(value);
  if (numericValue > 0) {
    return `+${compactFormatter.format(numericValue)}`;
  }
  return compactFormatter.format(numericValue);
}

export function formatInteger(value: unknown): string {
  return integerFormatter.format(toNumber(value));
}

export function formatWeight(value: number): string {
  return percentFormatter.format(value);
}

export function formatTimestamp(timestamp: unknown): string {
  const numericTimestamp = toNumber(timestamp);
  if (numericTimestamp <= 0) {
    return "Not calculated yet";
  }
  return dateTimeFormatter.format(new Date(numericTimestamp));
}

export function formatDaysFromMs(value: unknown): string {
  const days = toNumber(value) / (24 * 60 * 60 * 1000);
  const suffix = days === 1 ? "day" : "days";
  return `${formatScore(days)} ${suffix}`;
}

function getOptionalFormula(score: ApiWaveScore): ApiWaveScoreFormula | null {
  return (score as ApiWaveScoreWithRuntimeOptionalMetadata).formula ?? null;
}

function getOptionalQualityGate(
  score: ApiWaveScore
): ApiWaveScoreQualityGate | null {
  return (
    (score as ApiWaveScoreWithRuntimeOptionalMetadata).quality_gate ?? null
  );
}

export function hasFormulaMetadata(score: ApiWaveScore): boolean {
  return (
    getOptionalFormula(score) !== null && getOptionalQualityGate(score) !== null
  );
}

export function getFormula(score: ApiWaveScore): ApiWaveScoreFormula {
  return getOptionalFormula(score) ?? DEFAULT_FORMULA;
}

export function getQualityGate(score: ApiWaveScore): ApiWaveScoreQualityGate {
  const qualityScore = toNumber(score.quality_score);
  const qualityGate = getOptionalQualityGate(score);
  const threshold = qualityGate?.threshold ?? DEFAULT_QUALITY_GATE_THRESHOLD;
  const multiplier =
    qualityGate?.multiplier ?? clamp(qualityScore / threshold, 0, 1);
  return {
    threshold,
    multiplier,
    gated_hotness_score:
      qualityGate?.gated_hotness_score ??
      roundScore(toNumber(score.hotness_score) * multiplier),
  };
}

export function getCurrentOrigin(): string {
  const browserWindow = (
    globalThis as unknown as {
      readonly window?: Window;
    }
  ).window;
  if (browserWindow !== undefined) {
    return browserWindow.location.origin;
  }
  return "https://6529.io";
}

export function sanitizeReturnTo(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }
  if (trimmed.includes("\\") || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed, getCurrentOrigin());
    if (url.origin !== getCurrentOrigin()) {
      return null;
    }
    const safePath = `${url.pathname}${url.search}${url.hash}`;
    if (url.pathname === "/network/wave-score") {
      return null;
    }
    return safePath;
  } catch {
    return null;
  }
}

export function getBackLinkLabel(href: string): string {
  if (href.startsWith("/waves/") || href.startsWith("/messages/")) {
    return t(DEFAULT_LOCALE, "waveScore.navigation.back.wave");
  }
  if (href !== DEFAULT_BACK_HREF) {
    return t(DEFAULT_LOCALE, "waveScore.navigation.back.previous");
  }
  return t(DEFAULT_LOCALE, "waveScore.navigation.back.about");
}

export function scrollElementIntoNearestView(
  element: HTMLElement | null
): void {
  if (!element) {
    return;
  }

  const prefersReducedMotion =
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

  element.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "nearest",
  });
}

function sanitizeWaveId(value: string | null): string | null {
  let trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed || null;
}

export function parseWaveIdFromInput(input: string): string | null {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return null;
  }

  const strictWaveId = parseSeizeWaveLink(trimmedInput);
  if (strictWaveId) {
    return strictWaveId;
  }

  if (UUID_REGEX.test(trimmedInput)) {
    return trimmedInput;
  }

  try {
    const url = new URL(trimmedInput, getCurrentOrigin());
    const waveIdFromPath =
      getWaveIdFromPathname(url.pathname) ??
      getMessageIdFromPathname(url.pathname);
    if (waveIdFromPath) {
      return sanitizeWaveId(waveIdFromPath);
    }

    if (url.pathname === "/waves") {
      return sanitizeWaveId(url.searchParams.get("wave"));
    }
  } catch {
    return null;
  }

  return null;
}

export function getWaveDisplayHandle(wave: ApiWave): string {
  return wave.author.handle ?? wave.author.primary_address;
}

export function getWaveHref(wave: ApiWave): string {
  const isDirectMessage =
    wave.wave.type === ApiWaveType.Chat &&
    Boolean(wave.chat.scope.group?.is_direct_message);
  return getWaveRoute({
    waveId: wave.id,
    isDirectMessage,
    isApp: false,
  });
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not load that wave.";
}

export function buildQualityRows(score: ApiWaveScore): CalculationRow[] {
  const formula = getFormula(score);
  const weights = formula.quality_component_weights;
  const components = score.components;

  return [
    {
      label: "Creator score",
      description: "Creator TDH level, log-scaled up to the raw level cap.",
      score: toNumber(components.creator_score),
      weight: toNumber(weights.creator_score),
      tone: "tw-bg-sky-500",
    },
    {
      label: "Poster level weight",
      description:
        "Cumulative posts weighted by the TDH level of the people posting.",
      score: toNumber(components.level_weighted_participation_score),
      weight: toNumber(weights.level_weighted_participation_score),
      tone: "tw-bg-cyan-400",
    },
    {
      label: "Trusted diversity",
      description:
        "Distinct trusted posters, so one account cannot dominate the score.",
      score: toNumber(components.trusted_diversity_score),
      weight: toNumber(weights.trusted_diversity_score),
      tone: "tw-bg-emerald-400",
    },
    {
      label: "Trusted subscriptions",
      description:
        "Trusted subscribers to the wave, including level-weighted subscription strength.",
      score: toNumber(components.trusted_subscription_score),
      weight: toNumber(weights.trusted_subscription_score),
      tone: "tw-bg-teal-400",
    },
    {
      label: "Wave REP",
      description:
        "TDH-credit REP signal for the wave, signed and log-scaled before weighting.",
      score: toNumber(components.wave_rep_component_score),
      weight: toNumber(weights.wave_rep_component_score),
      tone: "tw-bg-fuchsia-400",
    },
  ];
}

export function calculateWeightedTotal(
  rows: readonly CalculationRow[]
): number {
  return rows.reduce((total, row) => total + row.score * row.weight, 0);
}

export function getRepComponentFormula(
  totalRep: number,
  maxWaveRep: number
): string {
  if (totalRep === 0) {
    return "50";
  }

  return `50 + sign(${formatInteger(totalRep)}) x 50 x log10(1 + min(abs(${formatInteger(
    totalRep
  )}), ${formatInteger(maxWaveRep)})) / log10(1 + ${formatInteger(
    maxWaveRep
  )})`;
}
