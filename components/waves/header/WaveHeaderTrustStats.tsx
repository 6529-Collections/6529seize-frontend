import type { ApiWave } from "@/generated/models/ApiWave";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChartBarIcon,
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

const WAVE_HEADER_TRUST_LOCALE = DEFAULT_LOCALE;

const formatScore = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return formatInteger(WAVE_HEADER_TRUST_LOCALE, Math.round(value));
};

const formatCompactRepTotal = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return formatNumber(WAVE_HEADER_TRUST_LOCALE, value, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
};

const formatFullRepTotal = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return formatInteger(WAVE_HEADER_TRUST_LOCALE, value);
};

type TrustStatTone = "score" | "quality" | "hot" | "rep";

interface TrustStat {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly ariaLabel: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly tone: TrustStatTone;
}

const toneClasses: Record<TrustStatTone, string> = {
  score: "tw-border-emerald-400/20 tw-bg-emerald-500/10 tw-text-emerald-200",
  quality: "tw-border-sky-400/20 tw-bg-sky-500/10 tw-text-sky-200",
  hot: "tw-border-amber-400/20 tw-bg-amber-500/10 tw-text-amber-200",
  rep: "tw-border-violet-400/20 tw-bg-violet-500/10 tw-text-violet-200",
};

export default function WaveHeaderTrustStats({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const visibilityScore = formatScore(wave.wave_score?.visibility_score);
  const qualityScore = formatScore(wave.wave_score?.quality_score);
  const hotnessScore = formatScore(wave.wave_score?.hotness_score);
  const compactWaveRep = formatCompactRepTotal(wave.wave_rep?.total_rep);
  const fullWaveRep = formatFullRepTotal(wave.wave_rep?.total_rep);
  const stats: TrustStat[] = [
    ...(visibilityScore === null
      ? []
      : [
          {
            id: "score",
            label: t(
              WAVE_HEADER_TRUST_LOCALE,
              "waves.score.details.scoreLabel"
            ),
            value: visibilityScore,
            ariaLabel: t(
              WAVE_HEADER_TRUST_LOCALE,
              "waves.score.details.visibilityAria",
              { visibilityScore }
            ),
            icon: ShieldCheckIcon,
            tone: "score" as const,
          },
        ]),
    ...(qualityScore === null
      ? []
      : [
          {
            id: "quality",
            label: t(WAVE_HEADER_TRUST_LOCALE, "waves.score.summary.quality"),
            value: qualityScore,
            ariaLabel: t(
              WAVE_HEADER_TRUST_LOCALE,
              "waves.score.summary.qualityAria",
              { qualityScore }
            ),
            icon: ChartBarIcon,
            tone: "quality" as const,
          },
        ]),
    ...(hotnessScore === null
      ? []
      : [
          {
            id: "hot",
            label: t(WAVE_HEADER_TRUST_LOCALE, "waves.score.details.hotLabel"),
            value: hotnessScore,
            ariaLabel: t(
              WAVE_HEADER_TRUST_LOCALE,
              "waves.score.details.hotnessAria",
              { hotnessScore }
            ),
            icon: FireIcon,
            tone: "hot" as const,
          },
        ]),
    ...(compactWaveRep === null
      ? []
      : [
          {
            id: "wave-rep",
            label: t(WAVE_HEADER_TRUST_LOCALE, "waves.score.summary.waveRep"),
            value: compactWaveRep,
            ariaLabel: t(
              WAVE_HEADER_TRUST_LOCALE,
              "waves.score.details.repTotalAria",
              { value: fullWaveRep ?? compactWaveRep }
            ),
            icon: ScaleIcon,
            tone: "rep" as const,
          },
        ]),
  ];

  if (!stats.length) {
    return null;
  }

  return (
    <dl
      aria-label={t(
        WAVE_HEADER_TRUST_LOCALE,
        "waves.score.details.statsAriaLabel"
      )}
      className="tw-grid tw-grid-cols-2 tw-gap-2"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            aria-label={stat.ariaLabel}
            className={`tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-py-2 ${toneClasses[stat.tone]}`}
          >
            <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
            <div className="tw-min-w-0">
              <dt className="tw-truncate tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-400">
                {stat.label}
              </dt>
              <dd className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-tabular-nums tw-text-current">
                {stat.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
