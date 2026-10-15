import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationIndexDay } from "@/lib/tdh/verification/schema";
import {
  agreementShare,
  totalDelta,
  verdictState,
  VERDICT_TONE,
} from "@/lib/tdh/verification/states";
import TdhStatusPill from "../../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_FOCUS_RING,
  TDH_TABLE,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
} from "../../shared/tdhStyles";
import {
  formatCycleDate,
  formatInteger,
  formatShare,
  formatShortCycleDate,
  formatSigned,
} from "./verificationFormat";

const RIGHT = 16;
const TOP_PANEL = { top: 22, height: 110 };
const BOTTOM_PANEL = { top: 164, height: 90 };
const HEIGHT = 292;
const MAX_BAR = 28;

const TONE_FILL = {
  success: "tw-fill-success",
  primary: "tw-fill-primary-400",
  warning: "tw-fill-amber-400",
  error: "tw-fill-error",
  neutral: "tw-fill-iron-400",
} as const;

interface ChartProps {
  readonly locale: SupportedLocale;
  readonly ordered: readonly VerificationIndexDay[];
  readonly selectedCycleDay: number | null;
  readonly cutoverCycleDay: number | null;
  readonly width: number;
  readonly maxLabels: number;
}

function HistoryChart({
  locale,
  ordered,
  selectedCycleDay,
  cutoverCycleDay,
  width,
  maxLabels,
}: ChartProps) {
  const id = useId();
  const left = width < 500 ? 58 : 66;
  const shares = ordered.map(
    (day) => agreementShare(day.identitiesEqual, day.identitiesTotal) ?? 1
  );
  const deltas = ordered.map((day) =>
    totalDelta(day.totalTdh.rust, day.totalTdh.live)
  );
  const minShare = Math.min(...shares, 1);
  const floor =
    minShare >= 0.999
      ? 0.999
      : Math.max(0, Math.floor(minShare * 1000) / 1000 - 0.001);
  const maxAbsDelta = Math.max(
    1,
    ...deltas.map((delta) => Math.abs(delta ?? 0))
  );
  const plotWidth = width - left - RIGHT;
  const step = plotWidth / Math.max(ordered.length, 1);
  const barWidth = Math.min(MAX_BAR, step * 0.5);
  const x = (index: number) => left + step * index + step / 2;
  const yShare = (share: number) =>
    TOP_PANEL.top + TOP_PANEL.height * (1 - (share - floor) / (1 - floor));
  const zeroY = BOTTOM_PANEL.top + BOTTOM_PANEL.height / 2;
  const yDelta = (delta: number) =>
    zeroY - (delta / maxAbsDelta) * (BOTTOM_PANEL.height / 2 - 6);
  const linePath = shares
    .map(
      (share, index) => `${index === 0 ? "M" : "L"}${x(index)},${yShare(share)}`
    )
    .join(" ");
  const labelEvery = Math.max(1, Math.ceil(ordered.length / maxLabels));
  const cutoverIndex =
    cutoverCycleDay === null
      ? -1
      : ordered.findIndex((day) => day.cycleDay === cutoverCycleDay);
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const label = "tw-fill-iron-400 tw-text-[12px]";
  const tickLabel = "tw-fill-iron-500 tw-text-[12px] tw-tabular-nums";

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="tw-block tw-h-auto tw-w-full"
    >
      <title id={titleId}>
        {t(locale, "network.tdh.verify.history.chartTitle", {
          count: formatInteger(locale, ordered.length),
        })}
      </title>
      <desc id={descId}>
        {t(locale, "network.tdh.verify.history.chartDesc")}
      </desc>
      <text x={left} y={12} className={label}>
        {t(locale, "network.tdh.verify.history.share")}
      </text>
      {[floor, (floor + 1) / 2, 1].map((tick) => (
        <g key={`share-${tick}`}>
          <line
            x1={left}
            x2={width - RIGHT}
            y1={yShare(tick)}
            y2={yShare(tick)}
            className="tw-stroke-iron-800"
            strokeDasharray={tick === 1 ? undefined : "3 4"}
          />
          <text
            x={left - 8}
            y={yShare(tick) + 4}
            textAnchor="end"
            className={tickLabel}
          >
            {formatShare(locale, tick)}
          </text>
        </g>
      ))}
      {ordered.length > 1 && (
        <path
          d={linePath}
          fill="none"
          strokeWidth="2"
          className="tw-stroke-iron-500"
        />
      )}
      <text x={left} y={BOTTOM_PANEL.top - 8} className={label}>
        {t(locale, "network.tdh.verify.history.delta")}
      </text>
      <line
        x1={left}
        x2={width - RIGHT}
        y1={zeroY}
        y2={zeroY}
        className="tw-stroke-iron-600"
      />
      {[maxAbsDelta, 0, -maxAbsDelta].map((tick) => (
        <text
          key={`delta-${tick}`}
          x={left - 8}
          y={yDelta(tick) + 4}
          textAnchor="end"
          className={tickLabel}
        >
          {formatSigned(locale, tick)}
        </text>
      ))}
      {ordered.map((day, index) => {
        const share = shares[index] ?? 1;
        const delta = deltas[index] ?? null;
        const tone = VERDICT_TONE[verdictState(day.verdict)];
        const selected = day.cycleDay === selectedCycleDay;
        return (
          <g key={day.cycleDay}>
            <title>
              {t(locale, "network.tdh.verify.history.point", {
                date: formatCycleDate(locale, day.date),
                cycle: formatInteger(locale, day.cycleDay),
                share: formatShare(locale, share),
                delta: delta === null ? "–" : formatSigned(locale, delta),
              })}
            </title>
            {delta !== null && (
              <rect
                x={x(index) - barWidth / 2}
                width={barWidth}
                y={Math.min(yDelta(delta), zeroY)}
                height={Math.max(Math.abs(yDelta(delta) - zeroY), 1)}
                rx="2"
                className={
                  delta < 0 ? "tw-fill-amber-400/80" : "tw-fill-primary-400/80"
                }
              />
            )}
            <circle
              cx={x(index)}
              cy={yShare(share)}
              r={selected ? 7 : 5}
              className={`${TONE_FILL[tone]} ${selected ? "tw-stroke-iron-50" : "tw-stroke-iron-900"}`}
              strokeWidth="2"
            />
            {(index % labelEvery === 0 || index === ordered.length - 1) && (
              <text
                x={x(index)}
                y={HEIGHT - 6}
                textAnchor="middle"
                className={`tw-text-[12px] ${selected ? "tw-fill-iron-100" : "tw-fill-iron-500"}`}
              >
                {formatShortCycleDate(locale, day.date)}
              </text>
            )}
          </g>
        );
      })}
      {cutoverIndex >= 0 && (
        <g>
          <line
            x1={x(cutoverIndex) - step / 2}
            x2={x(cutoverIndex) - step / 2}
            y1={TOP_PANEL.top}
            y2={BOTTOM_PANEL.top + BOTTOM_PANEL.height}
            className="tw-stroke-primary-300"
            strokeDasharray="4 4"
          />
          <text
            x={x(cutoverIndex) - step / 2 + 4}
            y={TOP_PANEL.top + 12}
            className="tw-fill-primary-300 tw-text-[12px]"
          >
            {t(locale, "network.tdh.verify.history.cutoverRule")}
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * Agreement over time (plan §10.3): identities equal between Rust and
 * 6529.io as a share (axis from 99.90% unless a day falls below), and the
 * total TDH difference as bars around zero. Server-rendered SVG, drawn at a
 * phone width and a desktop width, with a table version; points carry native
 * tooltips.
 */
export default function VerificationHistory({
  locale,
  days,
  selectedCycleDay,
  cutoverCycleDay,
}: {
  readonly locale: SupportedLocale;
  readonly days: readonly VerificationIndexDay[];
  readonly selectedCycleDay: number | null;
  readonly cutoverCycleDay: number | null;
}) {
  const ordered = [...days].sort(
    (left, right) => left.cycleDay - right.cycleDay
  );
  const chart = { locale, ordered, selectedCycleDay, cutoverCycleDay };

  return (
    <section aria-labelledby="tdh-verify-history-heading" className="tw-mt-10">
      <h2
        id="tdh-verify-history-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.history.heading")}
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.verify.history.caption")}
      </p>
      <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-3 sm:tw-p-5">
        <div className="md:tw-hidden">
          <HistoryChart {...chart} width={360} maxLabels={4} />
        </div>
        <div className="tw-hidden md:tw-block">
          <HistoryChart {...chart} width={1040} maxLabels={10} />
        </div>
      </div>
      <details className="tw-group tw-mt-3">
        <summary
          className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-lg tw-text-sm tw-font-medium tw-text-primary-300 hover:tw-text-primary-400 ${TDH_FOCUS_RING}`}
        >
          {t(locale, "network.tdh.verify.history.showTable")}
        </summary>
        <div
          className={`${TDH_TABLE_WRAP} tw-mt-2`}
          tabIndex={0}
          role="region"
          aria-label={t(locale, "network.tdh.verify.history.tableCaption")}
        >
          <table className={`${TDH_TABLE} tw-min-w-[44rem]`}>
            <caption className={TDH_CAPTION}>
              {t(locale, "network.tdh.verify.history.tableCaption")}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TDH_TH}>
                  {t(locale, "network.tdh.verify.history.date")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.verify.history.cycle")}
                </th>
                <th scope="col" className={TDH_TH}>
                  {t(locale, "network.tdh.verify.history.verdict")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.verify.history.identitiesEqual")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.verify.history.totalRust")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.verify.history.totalPython")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.verify.history.totalLive")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...ordered].reverse().map((day) => (
                <tr key={day.cycleDay}>
                  <th scope="row" className={`${TDH_TD} tw-font-medium`}>
                    {formatCycleDate(locale, day.date)}
                  </th>
                  <td className={TDH_TD_NUM}>
                    {formatInteger(locale, day.cycleDay)}
                  </td>
                  <td className={TDH_TD}>
                    <TdhStatusPill
                      pill={verdictState(day.verdict)}
                      locale={locale}
                      size="sm"
                    />
                  </td>
                  <td className={TDH_TD_NUM}>
                    {t(locale, "network.tdh.verify.tiles.ofTotal", {
                      equal: formatInteger(locale, day.identitiesEqual),
                      total: formatInteger(locale, day.identitiesTotal),
                    })}
                  </td>
                  <td className={TDH_TD_NUM}>
                    {formatInteger(locale, day.totalTdh.rust)}
                  </td>
                  <td className={TDH_TD_NUM}>
                    {day.totalTdh.python === null
                      ? t(locale, "network.tdh.verify.history.noValue")
                      : formatInteger(locale, day.totalTdh.python)}
                  </td>
                  <td className={TDH_TD_NUM}>
                    {day.totalTdh.live === null
                      ? t(locale, "network.tdh.verify.history.noValue")
                      : formatInteger(locale, day.totalTdh.live)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
