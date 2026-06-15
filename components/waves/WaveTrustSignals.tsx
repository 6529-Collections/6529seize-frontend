import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type WaveTrustSignalsVariant = "card" | "sidebar";

interface WaveTrustSignalsProps {
  readonly waveRep?: ApiWaveRepSummary | null | undefined;
  readonly waveScore?: ApiWaveScore | null | undefined;
  readonly variant?: WaveTrustSignalsVariant | undefined;
  readonly className?: string | undefined;
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

const getRepToneClasses = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return "tw-bg-iron-800/80 tw-text-iron-300 tw-ring-iron-600/70";
  }

  if (value > 0) {
    return "tw-bg-emerald-500/10 tw-text-emerald-200 tw-ring-emerald-400/25";
  }

  return "tw-bg-rose-500/10 tw-text-rose-200 tw-ring-rose-400/25";
};

const getContainerClasses = (
  variant: WaveTrustSignalsVariant,
  className: string | undefined
) =>
  [
    "tw-flex tw-flex-wrap tw-items-center tw-gap-1.5",
    variant === "sidebar" ? "tw-mt-1" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

const getChipClasses = (
  variant: WaveTrustSignalsVariant,
  toneClasses: string
) =>
  [
    "tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-ring-1 tw-ring-inset",
    variant === "sidebar"
      ? "tw-h-5 tw-px-1.5 tw-text-[10px]"
      : "tw-h-6 tw-px-2 tw-text-[11px] sm:tw-text-xs",
    toneClasses,
  ].join(" ");

export function WaveTrustSignals({
  waveRep,
  waveScore,
  variant = "card",
  className,
}: WaveTrustSignalsProps) {
  const visibilityScore = formatScore(waveScore?.visibility_score);
  const hotnessScore = formatScore(waveScore?.hotness_score);
  const repScore =
    waveRep === null || waveRep === undefined
      ? formatScore(waveScore?.rep_sort_score)
      : formatRep(waveRep.total_rep);
  const repLabel =
    waveRep === null || waveRep === undefined
      ? repScore === null
        ? null
        : `Wave REP score ${repScore} out of 100`
      : `Wave REP ${formatRepAccessibleValue(waveRep.total_rep)}`;
  const repToneValue =
    waveRep === null || waveRep === undefined ? null : waveRep.total_rep;

  if (!visibilityScore && !hotnessScore && !repScore) {
    return null;
  }

  return (
    <div className={getContainerClasses(variant, className)}>
      {visibilityScore && (
        <span
          className={getChipClasses(
            variant,
            "tw-bg-sky-500/10 tw-text-sky-200 tw-ring-sky-400/25"
          )}
          aria-label={`Visibility score ${visibilityScore} out of 100`}
        >
          <ShieldCheckIcon className="tw-size-3.5" aria-hidden="true" />
          <span>{visibilityScore}</span>
        </span>
      )}
      {hotnessScore && (
        <span
          className={getChipClasses(
            variant,
            "tw-bg-amber-500/10 tw-text-amber-200 tw-ring-amber-400/25"
          )}
          aria-label={`Hotness score ${hotnessScore} out of 100`}
        >
          <FireIcon className="tw-size-3.5" aria-hidden="true" />
          <span>{hotnessScore}</span>
        </span>
      )}
      {repScore && (
        <span
          className={getChipClasses(variant, getRepToneClasses(repToneValue))}
          aria-label={repLabel ?? undefined}
        >
          <ScaleIcon className="tw-size-3.5" aria-hidden="true" />
          <span>{repScore}</span>
        </span>
      )}
    </div>
  );
}
