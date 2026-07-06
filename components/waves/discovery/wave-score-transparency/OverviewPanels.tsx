import type { FormEvent } from "react";

import type { SidebarWave } from "@/types/waves.types";
import {
  ArrowLongRightIcon,
  ArrowPathIcon,
  CalculatorIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import { clamp, formatInteger, formulaSteps } from "./scoreUtils";
import type { CalculatorStatus } from "./types";

export function ScoreMeter({
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

export function FormulaPipeline() {
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

export function FormulaSummary() {
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

export function CalculatorPanel({
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
