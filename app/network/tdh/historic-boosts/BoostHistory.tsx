"use client";

import { Label, SvgFrame } from "@/components/explained/figures/svg";
import { useMeasuredWidth } from "@/components/explained/figures/useMeasuredWidth";
import { EX_HEX } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatUtcDate } from "@/i18n/format";
import { formatCents } from "@/lib/explained/format";

/**
 * Every boost schedule 6529.io has run, as a step line: the full-set boost
 * from seasons, version by version, against time, with today's version in
 * blue and the rule's ceiling dashed. Each step is labelled with its
 * version and its value; the table under it has the same numbers.
 */
export interface BoostStep {
  readonly version: string;
  /** ISO dates, the first and last day the version was in effect. */
  readonly from: string;
  readonly to: string;
  readonly fullSet: number;
  readonly current?: boolean;
  /** The step's name when it is not a version number: "before v1.1". */
  readonly label?: string;
}

/** "v1.3", or the step's own name ("before TDH v1.1"). */
function stepName(step: BoostStep): string {
  return step.label ?? "v" + step.version;
}

const HEIGHT = 260;
// Room on the left for the value axis, and under the line for each
// version's name at its start, then the years.
const PAD = { left: 44, right: 8, top: 28, bottom: 52 } as const;
/** The value axis's ticks: a boost of 1 (none), then each half. */
const TICK_STEP = 0.5;
/** Version names closer than this on the axis would overprint: the later one is left to the table. */
const NAME_GAP = 52;

export default function BoostHistory({
  steps,
  ceiling,
  label,
  ceilingLabel,
  locale,
}: {
  /** Oldest first. */
  readonly steps: readonly BoostStep[];
  readonly ceiling: number;
  /** The figure's accessible name. */
  readonly label: string;
  /** "2.00 at most, once every season pays". */
  readonly ceilingLabel: string;
  readonly locale: SupportedLocale;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(720);
  const first = steps[0];
  const last = steps.at(-1);
  if (!first || !last) return null;
  const t0 = Date.parse(first.from);
  const t1 = Date.parse(last.to);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const low = 1;
  const high = Math.max(ceiling, ...steps.map((step) => step.fullSet));
  const x = (iso: string) =>
    PAD.left + ((Date.parse(iso) - t0) / Math.max(1, t1 - t0)) * innerW;
  const y = (value: number) =>
    PAD.top + (1 - (value - low) / Math.max(0.01, high - low)) * innerH;
  const years: string[] = [];
  for (
    let year = new Date(t0).getUTCFullYear() + 1;
    year <= new Date(t1).getUTCFullYear();
    year += 1
  ) {
    years.push(`${year}-01-01`);
  }
  const narrow = width < 520;
  // Labels set so far, left to right: their side, level and right edge.
  const placed: { above: boolean; y: number; right: number }[] = [];
  const ticks: number[] = [];
  for (let value = low; value <= high + 0.001; value += TICK_STEP) {
    ticks.push(Math.round(value * 100) / 100);
  }
  // Each version's name under its start, the first of a crowded pair kept.
  let lastName = -Infinity;
  const names = steps.map((step, index) => {
    const at = x(step.from);
    const show = index > 0 && at - lastName >= NAME_GAP && !narrow;
    if (show) lastName = at;
    return show;
  });
  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="boost-history">
      <SvgFrame width={width} height={HEIGHT} label={label}>
        {ticks.map((value) => (
          <g key={value} data-boost-tick={value}>
            <line
              x1={PAD.left}
              y1={y(value)}
              x2={PAD.left + innerW}
              y2={y(value)}
              stroke={EX_HEX.line2}
              strokeOpacity={value === low ? 1 : 0.45}
            />
            <Label x={PAD.left - 8} y={y(value) + 4} anchor="end">
              {formatCents(locale, value)}
            </Label>
          </g>
        ))}
        <line
          x1={PAD.left}
          y1={y(ceiling)}
          x2={PAD.left + innerW}
          y2={y(ceiling)}
          stroke={EX_HEX.ink3}
          strokeDasharray="4 5"
        />
        <Label x={PAD.left + innerW} y={y(ceiling) - 8} anchor="end">
          {ceilingLabel}
        </Label>
        <line
          x1={PAD.left}
          y1={y(low)}
          x2={PAD.left + innerW}
          y2={y(low)}
          stroke={EX_HEX.line2}
        />
        {years
          // A year too near an edge would be cut by the frame.
          .filter((year) => x(year) > 18 && x(year) < width - 18)
          .map((year) => (
            <g key={year}>
              <line
                x1={x(year)}
                y1={y(low)}
                x2={x(year)}
                y2={y(low) + 5}
                stroke={EX_HEX.ink4}
              />
              <Label x={x(year)} y={HEIGHT - 6} anchor="middle">
                {year.slice(0, 4)}
              </Label>
            </g>
          ))}
        {steps.map((step, index) => {
          if (index === 0) placed.length = 0;
          const x0 = x(step.from);
          const x1 = x(step.to);
          const yy = y(step.fullSet);
          const next = steps[index + 1];
          const tone = step.current ? EX_HEX.you : EX_HEX.ink2;
          // Steps in a row at one value share one label, set on the first:
          // "before TDH v1.1, v1.1 · 1.20", not two labels for one level.
          const prevStep = index > 0 ? steps[index - 1] : undefined;
          const sameAsPrev =
            prevStep !== undefined &&
            !step.current &&
            prevStep.fullSet === step.fullSet;
          const run = [step];
          for (
            let after = index + 1;
            after < steps.length &&
            !steps[after]?.current &&
            steps[after]?.fullSet === step.fullSet;
            after += 1
          ) {
            const member = steps[after];
            if (member) run.push(member);
          }
          const tag = `${run.map(stepName).join(", ")} · ${formatCents(locale, step.fullSet)}`;
          // A short step's label sits at its start; the current one ends at
          // the right edge, so its label is anchored there.
          const anchor = step.current ? "end" : "start";
          const lx = step.current ? x1 : x0 + 4;
          // A step too narrow for its label sets it under its line, where
          // the next step's riser cannot cross it.
          const runEnd = run.at(-1);
          const runX1 = runEnd ? x(runEnd.to) : x1;
          const fits = step.current || runX1 - x0 >= tag.length * 7.4 + 8;
          // The first step has no riser to its left, so its label may sit
          // above the line even when it is wider than the step. A label that
          // would run into the one before it, on the same side and level,
          // takes the other side.
          // A merged label wider than its run sits under the line, where the
          // next step, higher, cannot cross it.
          let above = fits || (index === 0 && run.length === 1);
          const prev = placed[placed.length - 1];
          if (
            prev &&
            !step.current &&
            prev.above === above &&
            Math.abs(prev.y - yy) < 18 &&
            lx < prev.right + 8
          ) {
            above = !above;
          }
          const ly = above ? yy - 8 : yy + 18;
          if (!sameAsPrev) {
            placed.push({
              above,
              y: yy,
              right: step.current ? x1 : lx + tag.length * 7.4,
            });
          }
          return (
            <g key={step.version} data-boost-step={step.version}>
              {/* Each version's start, ticked on the axis. */}
              <line
                x1={x0}
                y1={y(low)}
                x2={x0}
                y2={y(low) + 8}
                stroke={step.current ? EX_HEX.you : EX_HEX.ink3}
                strokeWidth={1.5}
              />
              <line
                x1={x0}
                y1={yy}
                x2={x1}
                y2={yy}
                stroke={tone}
                strokeWidth={step.current ? 3 : 2}
              />
              {/* Each version's own start on the line, so two versions at
                  one level still read as two steps. */}
              {index > 0 && (
                <circle
                  cx={x0}
                  cy={yy}
                  r={3}
                  fill={EX_HEX.panel}
                  stroke={tone}
                  strokeWidth={1.5}
                />
              )}
              {names[index] && (
                <Label
                  x={x0}
                  y={y(low) + 22}
                  anchor="middle"
                  size={12}
                  weight={600}
                  tone={step.current ? "you" : "ink2"}
                >
                  {step.current
                    ? `${stepName(step)} · ${formatUtcDate(locale, step.from, { month: "short", day: "numeric", year: "numeric" })}`
                    : stepName(step)}
                </Label>
              )}
              {/* A riser only where the value changes: two steps at one
                  level join without a zero-length line through a label. */}
              {next && next.fullSet !== step.fullSet && (
                <line
                  x1={x1}
                  y1={yy}
                  x2={x1}
                  y2={y(next.fullSet)}
                  stroke={EX_HEX.ink3}
                  strokeWidth={1.5}
                />
              )}
              {!sameAsPrev &&
                (!narrow || step.current || (index === 0 && fits)) && (
                  <Label
                    x={lx}
                    y={ly}
                    anchor={anchor}
                    size={13}
                    weight={600}
                    tone={step.current ? "you" : "ink2"}
                  >
                    {tag}
                  </Label>
                )}
            </g>
          );
        })}
      </SvgFrame>
      {/* On a phone most steps are too short to label: the list says them. */}
      <p
        className={
          narrow
            ? "tw-m-0 tw-mt-2 tw-text-[13px] tw-leading-5 tw-text-iron-400"
            : "tw-sr-only"
        }
      >
        {steps
          .map(
            (step) =>
              `${stepName(step)}: ${formatCents(locale, step.fullSet)}, ${formatUtcDate(locale, step.from, { month: "short", day: "numeric", year: "numeric" })}`
          )
          .join("; ")}
      </p>
    </div>
  );
}
