import { ShieldCheckIcon } from "@heroicons/react/24/outline";

import { ScoreMeter } from "./OverviewPanels";
import { formatScore, formatWeight, toNumber } from "./scoreUtils";
import type { CalculationRow } from "./types";

export function ScoreStat({
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

export function WeightedRow({ row }: { readonly row: CalculationRow }) {
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

export function MiniEquation({
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

export function FormulaResultPanel({
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

export function PenaltyStat({
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

export function ConstantStat({
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
