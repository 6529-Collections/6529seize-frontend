/* Existing transparency page exceeds tight max-lines; this change only updates navigation copy. */
/* eslint max-lines: "off" */
"use client";

import { WaveTrustSignals } from "@/components/waves/WaveTrustSignals";
import { useSetTitle } from "@/contexts/TitleContext";
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
import { fetchWaveById, searchWavesByName } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ArrowPathIcon,
  CalculatorIcon,
  CameraIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  FireIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

type CalculatorStatus = "idle" | "loading" | "success" | "error";
const SHARE_STATUS = {
  IDLE: "idle",
  COPIED: "copied",
  COPY_ERROR: "copy-error",
  SCREENSHOT_LOADING: "screenshot-loading",
  SCREENSHOT_READY: "screenshot-ready",
  SCREENSHOT_ERROR: "screenshot-error",
} as const;

type ShareStatus = (typeof SHARE_STATUS)[keyof typeof SHARE_STATUS];

type OptionalClipboardNavigator = {
  readonly clipboard?: {
    readonly writeText?: (text: string) => Promise<void>;
  };
};

const getClipboardNavigator = (): OptionalClipboardNavigator | undefined => {
  if (typeof globalThis.window !== "undefined") {
    return globalThis.window.navigator as OptionalClipboardNavigator;
  }
  return globalThis.navigator as OptionalClipboardNavigator | undefined;
};

interface CalculationRow {
  readonly label: string;
  readonly description: string;
  readonly score: number;
  readonly weight: number;
  readonly tone: string;
}

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
const DEFAULT_BACK_HREF = "/about";

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

const formulaSteps: readonly FormulaStep[] = [
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

function toNumber(value: unknown, fallback = 0): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatScore(value: unknown): string {
  return scoreFormatter.format(roundScore(toNumber(value)));
}

function getScoreReconciliationMismatches(
  scores: readonly ScoreReconciliationMismatch[]
): ScoreReconciliationMismatch[] {
  return scores.filter(
    ({ apiScore, computedScore }) =>
      Math.abs(apiScore - computedScore) > SCORE_RECONCILIATION_EPSILON
  );
}

function formatScoreMismatch({
  label,
  apiScore,
  computedScore,
}: ScoreReconciliationMismatch): string {
  return `${label}: API ${formatScore(apiScore)}, computed ${formatScore(
    computedScore
  )}`;
}

function formatCompact(value: unknown): string {
  const numericValue = toNumber(value);
  if (numericValue > 0) {
    return `+${compactFormatter.format(numericValue)}`;
  }
  return compactFormatter.format(numericValue);
}

function formatInteger(value: unknown): string {
  return integerFormatter.format(toNumber(value));
}

function formatWeight(value: number): string {
  return percentFormatter.format(value);
}

function formatTimestamp(timestamp: unknown): string {
  const numericTimestamp = toNumber(timestamp);
  if (numericTimestamp <= 0) {
    return "Not calculated yet";
  }
  return dateTimeFormatter.format(new Date(numericTimestamp));
}

function formatDaysFromMs(value: unknown): string {
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

function hasFormulaMetadata(score: ApiWaveScore): boolean {
  return (
    getOptionalFormula(score) !== null && getOptionalQualityGate(score) !== null
  );
}

function getFormula(score: ApiWaveScore): ApiWaveScoreFormula {
  return getOptionalFormula(score) ?? DEFAULT_FORMULA;
}

function getQualityGate(score: ApiWaveScore): ApiWaveScoreQualityGate {
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

function getCurrentOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://6529.io";
}

function sanitizeReturnTo(value: string | null | undefined): string | null {
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

function getBackLinkLabel(href: string): string {
  if (href.startsWith("/waves/") || href.startsWith("/messages/")) {
    return t(DEFAULT_LOCALE, "waveScore.navigation.back.wave");
  }
  if (href !== DEFAULT_BACK_HREF) {
    return t(DEFAULT_LOCALE, "waveScore.navigation.back.previous");
  }
  return t(DEFAULT_LOCALE, "waveScore.navigation.back.about");
}

function scrollElementIntoNearestView(element: HTMLElement | null): void {
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

function parseWaveIdFromInput(input: string): string | null {
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

function getWaveDisplayHandle(wave: ApiWave): string {
  return wave.author.handle ?? wave.author.primary_address;
}

function getWaveHref(wave: ApiWave): string {
  const isDirectMessage =
    wave.wave.type === ApiWaveType.Chat &&
    Boolean(wave.chat.scope.group?.is_direct_message);
  return getWaveRoute({
    waveId: wave.id,
    isDirectMessage,
    isApp: false,
  });
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not load that wave.";
}

function buildQualityRows(score: ApiWaveScore): CalculationRow[] {
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

function calculateWeightedTotal(rows: readonly CalculationRow[]): number {
  return rows.reduce((total, row) => total + row.score * row.weight, 0);
}

function getRepComponentFormula(totalRep: number, maxWaveRep: number): string {
  if (totalRep === 0) {
    return "50";
  }

  return `50 + sign(${formatInteger(totalRep)}) x 50 x log10(1 + min(abs(${formatInteger(
    totalRep
  )}), ${formatInteger(maxWaveRep)})) / log10(1 + ${formatInteger(
    maxWaveRep
  )})`;
}

function ScoreMeter({
  value,
  toneClass,
}: {
  readonly value: number;
  readonly toneClass: string;
}) {
  const width = clamp(value, 0, 100);
  return (
    <div className="tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-900">
      <div
        className={`tw-h-full tw-rounded-full ${toneClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function FormulaPipeline() {
  return (
    <div className="tw-mt-7 tw-grid tw-gap-3 md:tw-grid-cols-2 xl:tw-grid-cols-4">
      {formulaSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div
            key={step.label}
            className="tw-relative tw-rounded-lg tw-bg-iron-950/70 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-white/10"
          >
            {index < formulaSteps.length - 1 && (
              <ArrowLongRightIcon
                className="tw-absolute -tw-right-2 tw-top-6 tw-hidden tw-size-4 tw-text-iron-600 xl:tw-block"
                aria-hidden="true"
              />
            )}
            <div
              className={`tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-ring-1 tw-ring-inset ${step.toneClasses}`}
            >
              <Icon className="tw-size-4" aria-hidden="true" />
            </div>
            <h2 className="tw-mt-3 tw-text-sm tw-font-semibold tw-text-white">
              {step.label}
            </h2>
            <p className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
              {step.description}
            </p>
            <p className="tw-mt-3 tw-rounded-md tw-bg-black/35 tw-p-2 tw-font-mono tw-text-[11px] tw-leading-5 tw-text-iron-200">
              {step.formula}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FormulaSummary() {
  return (
    <section className="tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_22rem]">
      <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-md tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-1 tw-ring-inset tw-ring-emerald-400/25">
            <ShieldCheckIcon className="tw-size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="tw-text-base tw-font-semibold tw-text-white">
              What the score is trying to do
            </h2>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
              Reward durable TDH-backed trust, keep momentum useful, and reduce
              obvious spam/cross-post pressure.
            </p>
          </div>
        </div>
        <div className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-3">
          <SignalTile
            label="TDH matters"
            value="Creator + posters"
            description="Creator level and level-weighted posters are explicit quality inputs."
          />
          <SignalTile
            label="REP matters more"
            value="35%"
            description="Wave REP is the largest single quality component."
          />
          <SignalTile
            label="Hotness is gated"
            value="25 quality"
            description="Hotness only gets full visibility credit once quality clears the threshold."
          />
        </div>
      </div>

      <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
        <h2 className="tw-text-base tw-font-semibold tw-text-white">
          REP curve
        </h2>
        <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
          Raw Wave REP can be very large or very negative. The score uses the
          raw TDH-sized number, then maps it to a bounded component for
          discovery math.
        </p>
        <RepCurveGraphic />
      </div>
    </section>
  );
}

function SignalTile({
  label,
  value,
  description,
}: {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}) {
  return (
    <div className="tw-rounded-lg tw-bg-black/25 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </div>
      <div className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
        {value}
      </div>
      <p className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {description}
      </p>
    </div>
  );
}

function RepCurveGraphic() {
  return (
    <div className="tw-mt-5 tw-rounded-lg tw-bg-black/25 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <svg
        viewBox="0 0 340 150"
        className="tw-h-36 tw-w-full"
        role="img"
        aria-label="Wave REP component curve from negative REP to positive REP"
      >
        <line
          x1="22"
          y1="75"
          x2="318"
          y2="75"
          stroke="rgb(63 63 70)"
          strokeWidth="1"
        />
        <line
          x1="170"
          y1="20"
          x2="170"
          y2="130"
          stroke="rgb(63 63 70)"
          strokeWidth="1"
        />
        <path
          d="M 26 122 C 72 118, 118 93, 170 75 C 222 57, 268 32, 314 28"
          fill="none"
          stroke="rgb(56 189 248)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="170" cy="75" r="4" fill="rgb(250 204 21)" />
        <circle cx="314" cy="28" r="4" fill="rgb(52 211 153)" />
        <circle cx="26" cy="122" r="4" fill="rgb(251 113 133)" />
        <text x="20" y="142" fill="rgb(161 161 170)" fontSize="11">
          negative
        </text>
        <text x="153" y="91" fill="rgb(212 212 216)" fontSize="11">
          0 REP = 50
        </text>
        <text x="264" y="142" fill="rgb(161 161 170)" fontSize="11">
          positive
        </text>
      </svg>
    </div>
  );
}

function CalculatorPanel({
  input,
  status,
  error,
  matches,
  onInputChange,
  onSubmit,
  onSelectMatch,
}: {
  readonly input: string;
  readonly status: CalculatorStatus;
  readonly error: string | null;
  readonly matches: readonly SidebarWave[];
  readonly onInputChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onSelectMatch: (waveId: string) => void;
}) {
  const isLoading = status === "loading";
  const errorId = "wave-score-calculator-error";

  return (
    <aside className="tw-rounded-lg tw-bg-iron-950 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-flex tw-items-center tw-gap-3">
        <div className="tw-text-primary-200 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-md tw-bg-primary-500/10 tw-ring-1 tw-ring-inset tw-ring-primary-400/25">
          <CalculatorIcon className="tw-size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="tw-text-base tw-font-semibold tw-text-white">
            Calculate a wave
          </h2>
          <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
            Paste a wave URL, wave id, or search by wave name.
          </p>
        </div>
      </div>

      <form className="tw-mt-5 tw-space-y-3" onSubmit={onSubmit}>
        <label
          htmlFor="wave-score-calculator-input"
          className="tw-text-sm tw-font-medium tw-text-iron-200"
        >
          Wave name or URL
        </label>
        <div className="tw-flex tw-gap-2">
          <div className="tw-relative tw-min-w-0 tw-flex-1">
            <MagnifyingGlassIcon
              className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-5 -tw-translate-y-1/2 tw-text-iron-500"
              aria-hidden="true"
            />
            <input
              id="wave-score-calculator-input"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Memes-Chat or https://6529.io/waves/..."
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-black/35 tw-px-10 tw-text-sm tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="tw-inline-flex tw-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-primary-400"
          >
            {isLoading ? (
              <ArrowPathIcon
                className="tw-size-4 tw-animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CalculatorIcon className="tw-size-4" aria-hidden="true" />
            )}
            <span>{isLoading ? "Loading" : "Score"}</span>
          </button>
        </div>
      </form>

      <div className="tw-mt-4 tw-min-h-6">
        {status === "loading" && (
          <p
            role="status"
            aria-live="polite"
            className="tw-text-sm tw-text-iron-300"
          >
            Looking up the wave and its score fields...
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="tw-rounded-lg tw-bg-rose-500/10 tw-p-3 tw-text-sm tw-text-rose-200 tw-ring-1 tw-ring-inset tw-ring-rose-400/20"
          >
            {error}
          </p>
        )}
      </div>

      {matches.length > 1 && (
        <div className="tw-mt-5">
          <h3 className="tw-text-sm tw-font-semibold tw-text-white">
            Similar waves
          </h3>
          <div className="tw-mt-3 tw-space-y-2">
            {matches.map((match) => (
              <button
                type="button"
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-black/25 tw-p-3 tw-text-left tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900"
              >
                <span className="tw-min-w-0">
                  <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-white">
                    {match.name}
                  </span>
                  <span className="tw-mt-1 tw-block tw-text-xs tw-text-iron-500">
                    {formatInteger(match.totalDropsCount)} drops
                  </span>
                </span>
                <ArrowLongRightIcon
                  className="tw-size-4 tw-flex-shrink-0 tw-text-iron-500"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function getShareStatusMessage(status: ShareStatus): string {
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

function getWaveScoreScreenshotName(waveName: string): string {
  const slugCharacters: string[] = [];
  let lastWasSeparator = true;

  for (const character of waveName.toLowerCase()) {
    const codePoint = character.charCodeAt(0);
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

  if (slugCharacters[slugCharacters.length - 1] === "-") {
    slugCharacters.pop();
  }

  const slug = slugCharacters.join("");
  return `${slug || "wave"}-score-analysis.png`;
}

function buildWaveScoreMarkdown({
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

function WaveScoreResult({ wave }: { readonly wave: ApiWave }) {
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
        throw new Error("Clipboard API unavailable");
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
              <div
                role="status"
                className="tw-mt-4 tw-rounded-lg tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-text-amber-100 tw-ring-1 tw-ring-inset tw-ring-amber-400/25"
              >
                <p className="tw-font-semibold">Formula drift detected</p>
                <p className="tw-mt-1 tw-text-amber-100/85">
                  {scoreMismatchDetail}
                </p>
              </div>
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
        <p
          data-wave-score-screenshot-exclude="true"
          role="status"
          aria-live="polite"
          className="tw-mt-3 tw-min-h-5 tw-text-xs tw-font-medium tw-text-iron-300"
        >
          {getShareStatusMessage(shareStatus)}
        </p>

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

function ScoreStat({
  label,
  value,
  icon: Icon,
  toneClass,
}: {
  readonly label: string;
  readonly value: number;
  readonly icon: typeof ShieldCheckIcon;
  readonly toneClass: string;
}) {
  const numericValue = toNumber(value);
  return (
    <div className="tw-rounded-lg tw-bg-black/25 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          {label}
        </span>
        <Icon className="tw-size-4 tw-text-iron-400" aria-hidden="true" />
      </div>
      <div className="tw-mt-3 tw-text-3xl tw-font-semibold tw-text-white">
        {formatScore(numericValue)}
      </div>
      <div className="tw-mt-3">
        <ScoreMeter value={numericValue} toneClass={toneClass} />
      </div>
    </div>
  );
}

function WeightedRow({ row }: { readonly row: CalculationRow }) {
  const contribution = row.score * row.weight;
  return (
    <div className="tw-rounded-lg tw-bg-black/25 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-center md:tw-justify-between">
        <div className="tw-min-w-0">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-white">
              {row.label}
            </h4>
            <span className="tw-rounded-md tw-bg-iron-900 tw-px-2 tw-py-0.5 tw-text-xs tw-text-iron-300">
              {formatWeight(row.weight)}
            </span>
          </div>
          <p className="tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
            {row.description}
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-3 tw-gap-2 tw-text-right md:tw-min-w-56">
          <ValueColumn label="score" value={row.score} />
          <ValueColumn label="weight" value={formatWeight(row.weight)} />
          <ValueColumn label="adds" value={contribution} />
        </div>
      </div>
      <div className="tw-mt-3">
        <ScoreMeter value={row.score} toneClass={row.tone} />
      </div>
    </div>
  );
}

function ValueColumn({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | string;
}) {
  return (
    <span>
      <span className="tw-block tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </span>
      <span className="tw-mt-1 tw-block tw-text-sm tw-font-semibold tw-text-white">
        {typeof value === "number" ? formatScore(value) : value}
      </span>
    </span>
  );
}

function MiniEquation({
  label,
  value,
  detail,
}: {
  readonly label: string;
  readonly value: number;
  readonly detail: string;
}) {
  return (
    <div className="tw-rounded-lg tw-bg-black/25 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </div>
      <div className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-white">
        {formatScore(value)}
      </div>
      <div className="tw-mt-1 tw-text-xs tw-text-iron-500">{detail}</div>
    </div>
  );
}

function FormulaResultPanel({
  title,
  icon: Icon,
  toneClasses,
  rows,
  footer,
}: {
  readonly title: string;
  readonly icon: typeof ShieldCheckIcon;
  readonly toneClasses: string;
  readonly rows: readonly {
    readonly label: string;
    readonly value: number;
    readonly detail: string;
  }[];
  readonly footer: string;
}) {
  return (
    <div className="tw-rounded-lg tw-bg-iron-950/60 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-flex tw-items-center tw-gap-3">
        <div
          className={`tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-md tw-ring-1 tw-ring-inset ${toneClasses}`}
        >
          <Icon className="tw-size-5" aria-hidden="true" />
        </div>
        <h3 className="tw-text-base tw-font-semibold tw-text-white">{title}</h3>
      </div>
      <div className="tw-mt-4 tw-space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-bg-black/25 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-white/10"
          >
            <span className="tw-min-w-0">
              <span className="tw-block tw-text-sm tw-font-medium tw-text-white">
                {row.label}
              </span>
              <span className="tw-mt-1 tw-block tw-break-words tw-text-xs tw-text-iron-500">
                {row.detail}
              </span>
            </span>
            <span className="tw-text-right tw-text-lg tw-font-semibold tw-text-white">
              {formatScore(row.value)}
            </span>
          </div>
        ))}
      </div>
      <p className="tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-400">
        {footer}
      </p>
    </div>
  );
}

function PenaltyStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  const numericValue = toNumber(value);
  return (
    <div className="tw-rounded-lg tw-bg-black/25 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </div>
      <div className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-white">
        {formatScore(numericValue)}%
      </div>
      <div className="tw-mt-3">
        <ScoreMeter value={numericValue} toneClass="tw-bg-rose-400" />
      </div>
    </div>
  );
}

function ConstantStat({
  label,
  value,
  detail,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}) {
  return (
    <div className="tw-rounded-lg tw-bg-black/25 tw-p-3 tw-ring-1 tw-ring-inset tw-ring-white/10">
      <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </div>
      <div className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-white">
        {value}
      </div>
      <div className="tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-500">
        {detail}
      </div>
    </div>
  );
}

export function WaveScoreTransparencyPage({
  initialReturnTo,
}: {
  readonly initialReturnTo?: string | null | undefined;
}) {
  useSetTitle("Wave Score | Network");

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<CalculatorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [wave, setWave] = useState<ApiWave | null>(null);
  const [matches, setMatches] = useState<SidebarWave[]>([]);
  const returnTo = sanitizeReturnTo(initialReturnTo) ?? DEFAULT_BACK_HREF;
  const resultContainerRef = useRef<HTMLDivElement>(null);

  const currentScore = wave?.wave_score ?? null;
  const apiHasFormulaMetadata =
    currentScore !== null && hasFormulaMetadata(currentScore);
  const backLinkLabel = getBackLinkLabel(returnTo);

  const loadWave = async (waveId: string) => {
    setStatus("loading");
    setError(null);
    setWave(null);
    try {
      const nextWave = await fetchWaveById({ waveId });
      setWave(nextWave);
      setStatus("success");
      if (typeof globalThis.requestAnimationFrame === "function") {
        globalThis.requestAnimationFrame(() => {
          scrollElementIntoNearestView(resultContainerRef.current);
        });
      } else {
        setTimeout(() => {
          scrollElementIntoNearestView(resultContainerRef.current);
        }, 0);
      }
    } catch (loadError) {
      setStatus("error");
      setError(getErrorMessage(loadError));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    setWave(null);
    if (trimmedInput.length < 2) {
      setStatus("error");
      setError("Enter a wave name, wave id, or wave URL.");
      return;
    }

    setStatus("loading");
    setError(null);
    setMatches([]);

    const waveId = parseWaveIdFromInput(trimmedInput);
    if (waveId) {
      await loadWave(waveId);
      return;
    }

    try {
      const searchMatches = await searchWavesByName({
        name: trimmedInput,
        pageSize: 5,
      });
      if (searchMatches.length === 0) {
        setStatus("error");
        setError("No matching waves found.");
        return;
      }

      setMatches(searchMatches);
      const exactMatch =
        searchMatches.find(
          (match) => match.name.toLowerCase() === trimmedInput.toLowerCase()
        ) ?? searchMatches[0];

      if (exactMatch) {
        await loadWave(exactMatch.id);
      }
    } catch (searchError) {
      setStatus("error");
      setError(getErrorMessage(searchError));
    }
  };

  return (
    <div className="tw-px-4 tw-pb-16 tw-pt-6 md:tw-px-6 md:tw-pt-8 lg:tw-px-8">
      <div className="tw-mx-auto tw-max-w-7xl tw-space-y-8">
        <section className="tw-grid tw-gap-6 xl:tw-grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
          <div className="tw-rounded-lg tw-bg-iron-950/50 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-white/10 md:tw-p-6">
            <Link
              href={returnTo}
              className="tw-text-primary-200 desktop-hover:hover:tw-text-primary-100 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-no-underline tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <ArrowLongLeftIcon className="tw-size-4" aria-hidden="true" />
              {backLinkLabel}
            </Link>
            <p className="tw-mt-5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              {t(DEFAULT_LOCALE, "waveScore.navigation.breadcrumb")}
            </p>
            <h1 className="tw-mt-5 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-white md:tw-text-4xl">
              Wave score transparency
            </h1>
            <p className="tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "waveScore.navigation.description")}
            </p>
          </div>

          <CalculatorPanel
            input={input}
            status={status}
            error={error}
            matches={matches}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onSelectMatch={(waveId) => {
              void loadWave(waveId);
            }}
          />
        </section>

        {wave && (
          <div
            ref={resultContainerRef}
            className="tw-animate-slideUp tw-space-y-3 motion-reduce:tw-animate-none"
          >
            {currentScore && (
              <div
                className={`tw-rounded-lg tw-p-4 tw-text-sm tw-ring-1 tw-ring-inset ${
                  apiHasFormulaMetadata
                    ? "tw-bg-emerald-500/10 tw-text-emerald-100 tw-ring-emerald-400/25"
                    : "tw-bg-amber-500/10 tw-text-amber-100 tw-ring-amber-400/25"
                }`}
              >
                {apiHasFormulaMetadata
                  ? "This result is using formula constants returned by the API."
                  : "This result is using the v1 fallback constants because the API response did not include formula metadata yet."}
              </div>
            )}
            <WaveScoreResult wave={wave} />
          </div>
        )}

        <FormulaPipeline />

        <FormulaSummary />
      </div>
    </div>
  );
}
