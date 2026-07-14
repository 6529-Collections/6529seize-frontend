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

interface TrustStat {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly ariaLabel: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly iconClassName: string;
}

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
            iconClassName: "tw-text-emerald-400/80",
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
            iconClassName: "tw-text-sky-400/80",
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
            iconClassName: "tw-text-amber-400/80",
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
            iconClassName: "tw-text-indigo-400/80",
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
      className={`tw-grid tw-gap-px tw-border-x-0 tw-border-y tw-border-solid tw-border-white/5 tw-bg-white/5 ${
        stats.length === 1 ? "tw-grid-cols-1" : "tw-grid-cols-2"
      }`}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const fillsLastRow =
          stats.length > 1 &&
          stats.length % 2 === 1 &&
          index === stats.length - 1;

        return (
          <div
            key={stat.id}
            aria-label={stat.ariaLabel}
            className={`tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-bg-iron-950 tw-px-2 tw-py-2 ${
              fillsLastRow ? "tw-col-span-2" : ""
            }`}
          >
            <span
              className={`tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center ${stat.iconClassName}`}
            >
              <Icon className="tw-size-3.5" aria-hidden="true" />
            </span>
            <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
              <dt className="tw-truncate tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-leading-3 tw-tracking-[0.06em] tw-text-iron-500 sm:tw-tracking-[0.1em]">
                {stat.label}
              </dt>
              <dd className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-tabular-nums tw-leading-5 tw-text-iron-100">
                {stat.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
