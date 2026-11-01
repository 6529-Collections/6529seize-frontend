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
}

const HEIGHT = 230;
const PAD = { left: 8, right: 8, top: 28, bottom: 30 } as const;

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
  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="boost-history">
      <SvgFrame width={width} height={HEIGHT} label={label}>
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
        {years.map((year) => (
          <g key={year}>
            <line
              x1={x(year)}
              y1={y(low)}
              x2={x(year)}
              y2={y(low) + 5}
              stroke={EX_HEX.ink4}
            />
            <Label x={x(year)} y={HEIGHT - 8} anchor="middle">
              {year.slice(0, 4)}
            </Label>
          </g>
        ))}
        {steps.map((step, index) => {
          const x0 = x(step.from);
          const x1 = x(step.to);
          const yy = y(step.fullSet);
          const next = steps[index + 1];
          const tone = step.current ? EX_HEX.you : EX_HEX.ink2;
          const tag = `v${step.version} · ${formatCents(locale, step.fullSet)}`;
          // A short step's label sits at its start; the current one ends at
          // the right edge, so its label is anchored there.
          const anchor = step.current ? "end" : "start";
          const lx = step.current ? x1 : x0 + 4;
          // A step too narrow for its label sets it under its line, where
          // the next step's riser cannot cross it.
          const fits = step.current || x1 - x0 >= tag.length * 7.4 + 8;
          const ly = fits ? yy - 8 : yy + 18;
          return (
            <g key={step.version} data-boost-step={step.version}>
              {step.current && (
                <rect
                  x={x0}
                  y={yy}
                  width={Math.max(0, x1 - x0)}
                  height={Math.max(0, y(low) - yy)}
                  fill="rgba(82,139,255,0.16)"
                />
              )}
              <line
                x1={x0}
                y1={yy}
                x2={x1}
                y2={yy}
                stroke={tone}
                strokeWidth={step.current ? 3 : 2}
              />
              {next && (
                <line
                  x1={x1}
                  y1={yy}
                  x2={x1}
                  y2={y(next.fullSet)}
                  stroke={EX_HEX.ink3}
                  strokeWidth={1.5}
                />
              )}
              {(!narrow || step.current || index === 0) && (
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
      <p className="tw-sr-only">
        {steps
          .map(
            (step) =>
              `v${step.version}: ${formatCents(locale, step.fullSet)}, ${formatUtcDate(locale, step.from, { month: "short", day: "numeric", year: "numeric" })}`
          )
          .join("; ")}
      </p>
    </div>
  );
}
