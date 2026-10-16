import { useId } from "react";
import TdhTableFrame from "../../shared/TdhTableFrame";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationIndexDay } from "@/lib/tdh/verification/schema";
import {
  agreementShare,
  indexDayVerdict,
  totalDelta,
  VERDICT_TONE,
} from "@/lib/tdh/verification/states";
import TdhHeading from "../../shared/TdhHeading";
import { WIDE_WIDTH } from "../../shared/TdhSvg";
import TdhDisclosure from "../../shared/TdhDisclosure";
import TdhStatusPill from "../../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_TABLE,
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

const TABLE_CAPTION_KEY = "network.tdh.verify.history.tableCaption";
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
    (day) =>
      agreementShare(day.identitiesEqual ?? 0, day.identitiesTotal ?? 0) ?? 1
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
  const label = "tw-fill-iron-300 tw-text-[13px]";
  const tickLabel = "tw-fill-iron-400 tw-text-[13px] tw-tabular-nums";

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
            data-tdh-grid=""
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
        const tone = VERDICT_TONE[indexDayVerdict(day)];
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

const MIN_DAYS_FOR_CHART = 7;

type HistoryRow =
  | { readonly kind: "day"; readonly day: VerificationIndexDay }
  | { readonly kind: "missing"; readonly cycleDay: number };

function rowCycleDay(row: HistoryRow): number {
  return row.kind === "day" ? row.day.cycleDay : row.cycleDay;
}

/** Reported days and days without a report, newest first. */
function historyRows(
  ordered: readonly VerificationIndexDay[],
  missing: readonly number[]
): HistoryRow[] {
  return [
    ...ordered.map((day): HistoryRow => ({ kind: "day", day })),
    ...missing.map((cycleDay): HistoryRow => ({ kind: "missing", cycleDay })),
  ].sort((left, right) => rowCycleDay(right) - rowCycleDay(left));
}

function missingDate(cycleDay: number): string {
  return new Date(cycleDay * 86_400_000).toISOString().slice(0, 10);
}

function identitiesEqualText(
  locale: SupportedLocale,
  day: VerificationIndexDay,
  noValue: string
): string {
  return day.identitiesEqual === null || day.identitiesTotal === null
    ? noValue
    : t(locale, "network.tdh.verify.history.equalOf", {
        equal: formatInteger(locale, day.identitiesEqual),
        total: formatInteger(locale, day.identitiesTotal),
      });
}

/**
 * The Rust core against the Python reference on a day, from the index: the
 * daily job's verdict is OK only when the two agree on every record (any
 * difference is RUST_PYTHON_MISMATCH and an alarm); on other verdicts the
 * index carries only the two totals.
 */
function rustPythonText(
  locale: SupportedLocale,
  day: VerificationIndexDay,
  noValue: string
): string {
  if (day.verdict === "OK") {
    return t(locale, "network.tdh.verify.history.rustPythonEqual");
  }
  if (day.verdict === "RUST_PYTHON_MISMATCH") {
    return t(locale, "network.tdh.verify.history.rustPythonDiffer");
  }
  if (day.totalTdh.python === null) {
    return noValue;
  }
  const delta = day.totalTdh.python - day.totalTdh.rust;
  return delta === 0
    ? t(locale, "network.tdh.verify.history.rustPythonTotals")
    : formatSigned(locale, delta);
}

function optionalInteger(
  locale: SupportedLocale,
  value: number | null,
  noValue: string
): string {
  return value === null ? noValue : formatInteger(locale, value);
}

/**
 * The daily results on a phone: one card per day, newest first, with the same
 * values as the table's columns, so nothing needs a sideways scroll.
 */
function HistoryList({
  locale,
  ordered,
  missing,
}: {
  readonly locale: SupportedLocale;
  readonly ordered: readonly VerificationIndexDay[];
  readonly missing: readonly number[];
}) {
  const noValue = t(locale, "network.tdh.verify.history.noValue");
  const cycleLabel = t(locale, "network.tdh.verify.history.cycle");
  return (
    <ol
      aria-label={t(locale, TABLE_CAPTION_KEY)}
      className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0"
    >
      {historyRows(ordered, missing).map((row) => {
        if (row.kind === "missing") {
          return (
            <li
              key={`missing-${row.cycleDay}`}
              className="tw-rounded-xl tw-border tw-border-dashed tw-border-white/[0.1] tw-bg-iron-900/60 tw-p-4"
            >
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
                {formatCycleDate(locale, missingDate(row.cycleDay))}
              </p>
              <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
                {cycleLabel} {formatInteger(locale, row.cycleDay)}
              </p>
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-amber-200">
                {t(locale, "network.tdh.verify.history.noReport")}
              </p>
            </li>
          );
        }
        const { day } = row;
        const delta = totalDelta(day.totalTdh.rust, day.totalTdh.live);
        const values = [
          {
            key: "identitiesEqualShort",
            value: identitiesEqualText(locale, day, noValue),
          },
          {
            key: "rustPython",
            value: rustPythonText(locale, day, noValue),
          },
          {
            key: "deltaColumn",
            value: delta === null ? noValue : formatSigned(locale, delta),
          },
          { key: "totalRust", value: formatInteger(locale, day.totalTdh.rust) },
          {
            key: "totalPython",
            value: optionalInteger(locale, day.totalTdh.python, noValue),
          },
          {
            key: "totalLive",
            value: optionalInteger(locale, day.totalTdh.live, noValue),
          },
        ] as const;
        return (
          <li
            key={day.cycleDay}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 tw-@container"
          >
            <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
              <div className="tw-min-w-0">
                <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                  {formatCycleDate(locale, day.date)}
                </p>
                <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
                  {cycleLabel} {formatInteger(locale, day.cycleDay)}
                </p>
              </div>
              <TdhStatusPill
                pill={indexDayVerdict(day)}
                locale={locale}
                size="sm"
              />
            </div>
            <dl className="tw-m-0 tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2.5 @[17rem]:tw-grid-cols-2">
              {values.map((item) => (
                <div key={item.key} className="tw-min-w-0">
                  <dt className="tw-text-sm tw-text-iron-400">
                    {t(locale, `network.tdh.verify.history.${item.key}`)}
                  </dt>
                  <dd className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-100">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ol>
  );
}

function HistoryTable({
  locale,
  ordered,
  missing,
  caption,
}: {
  readonly locale: SupportedLocale;
  readonly ordered: readonly VerificationIndexDay[];
  readonly missing: readonly number[];
  readonly caption: boolean;
}) {
  const rows = historyRows(ordered, missing);
  const noValue = t(locale, "network.tdh.verify.history.noValue");
  return (
    <TdhTableFrame label={t(locale, TABLE_CAPTION_KEY)}>
      <table
        className={TDH_TABLE}
        aria-label={caption ? undefined : t(locale, TABLE_CAPTION_KEY)}
      >
        {caption && (
          <caption className={TDH_CAPTION}>
            {t(locale, TABLE_CAPTION_KEY)}
          </caption>
        )}
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
              {t(locale, "network.tdh.verify.history.rustPython")}
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
            <th scope="col" className={TDH_TH_NUM}>
              {t(locale, "network.tdh.verify.history.deltaColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.kind === "missing") {
              const date = missingDate(row.cycleDay);
              return (
                <tr key={`missing-${row.cycleDay}`}>
                  <th
                    scope="row"
                    className={`${TDH_TD} tw-font-normal tw-text-iron-400`}
                  >
                    {formatCycleDate(locale, date)}
                  </th>
                  <td className={`${TDH_TD_NUM} tw-text-iron-400`}>
                    {formatInteger(locale, row.cycleDay)}
                  </td>
                  <td colSpan={7} className={`${TDH_TD} tw-text-amber-200`}>
                    {t(locale, "network.tdh.verify.history.noReport")}
                  </td>
                </tr>
              );
            }
            const { day } = row;
            const delta = totalDelta(day.totalTdh.rust, day.totalTdh.live);
            return (
              <tr key={day.cycleDay}>
                <th scope="row" className={`${TDH_TD} tw-font-medium`}>
                  {formatCycleDate(locale, day.date)}
                </th>
                <td className={TDH_TD_NUM}>
                  {formatInteger(locale, day.cycleDay)}
                </td>
                <td className={TDH_TD}>
                  <TdhStatusPill
                    pill={indexDayVerdict(day)}
                    locale={locale}
                    size="sm"
                  />
                </td>
                <td className={TDH_TD_NUM}>
                  {identitiesEqualText(locale, day, noValue)}
                </td>
                <td className={TDH_TD_NUM}>
                  {rustPythonText(locale, day, noValue)}
                </td>
                <td className={TDH_TD_NUM}>
                  {formatInteger(locale, day.totalTdh.rust)}
                </td>
                <td className={TDH_TD_NUM}>
                  {optionalInteger(locale, day.totalTdh.python, noValue)}
                </td>
                <td className={TDH_TD_NUM}>
                  {optionalInteger(locale, day.totalTdh.live, noValue)}
                </td>
                <td className={TDH_TD_NUM}>
                  {delta === null ? noValue : formatSigned(locale, delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TdhTableFrame>
  );
}

/**
 * Agreement over time (plan §10.3): identities equal between Rust and
 * 6529.io as a share, and the total TDH difference as bars around zero.
 * Below seven days a chart says little, so the days show as a table on wide
 * screens and as one card per day below `xl`; from the seventh, the chart is
 * drawn at a width composed for the column (560 units to `xl`, 1,040 from
 * it), never scaled below its own size, with the table one click away. Days
 * without a report are listed as such.
 */
export default function VerificationHistory({
  locale,
  days,
  missing,
  selectedCycleDay,
  cutoverCycleDay,
}: {
  readonly locale: SupportedLocale;
  readonly days: readonly VerificationIndexDay[];
  readonly missing: readonly number[];
  readonly selectedCycleDay: number | null;
  readonly cutoverCycleDay: number | null;
}) {
  const ordered = [...days].sort(
    (left, right) => left.cycleDay - right.cycleDay
  );
  const chart = { locale, ordered, selectedCycleDay, cutoverCycleDay };
  const enough = ordered.length >= MIN_DAYS_FOR_CHART;

  return (
    <section
      id="history"
      aria-labelledby="history-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="history"
        title={t(locale, "network.tdh.verify.history.heading")}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
      />
      <p className="tw-m-0 tw-mt-2 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.verify.history.caption")}
      </p>
      {enough ? (
        <>
          <div className="tw-mt-4 tw-hidden md:tw-block">
            <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-5">
              <div className="xl:tw-hidden">
                <HistoryChart {...chart} width={WIDE_WIDTH} maxLabels={6} />
              </div>
              <div className="tw-hidden xl:tw-block">
                <HistoryChart {...chart} width={1040} maxLabels={10} />
              </div>
            </div>
            <TdhDisclosure
              className="tw-mt-3"
              tone="link"
              summary={t(locale, "network.tdh.verify.history.showTable")}
            >
              <HistoryTable
                locale={locale}
                ordered={ordered}
                missing={missing}
                caption
              />
            </TdhDisclosure>
          </div>
          <div className="tw-mt-4 md:tw-hidden">
            <HistoryList locale={locale} ordered={ordered} missing={missing} />
          </div>
        </>
      ) : (
        <>
          <div className="tw-mt-4 tw-hidden xl:tw-block">
            <HistoryTable
              locale={locale}
              ordered={ordered}
              missing={missing}
              caption={false}
            />
          </div>
          <div className="tw-mt-4 xl:tw-hidden">
            <HistoryList locale={locale} ordered={ordered} missing={missing} />
          </div>
        </>
      )}
    </section>
  );
}
