"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_HEX } from "../tokens";
import { Label, SvgFrame } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * Convergence (EXPLAINED.md §4.3): separately written programs as lanes,
 * round by round. Where they agree the lanes meet in one green knot; a lane
 * that differs leaves in rose and is named. Left to right on a desktop, top
 * to bottom on a phone. Used for "Many hands, one answer" (the difftest
 * rounds) and any comparison of programs over time.
 */
export interface ConvergenceProgram {
  readonly id: string;
  readonly label: string;
}

export interface ConvergenceRound {
  readonly label: string;
  /** The programs that differ from the rest in this round; none means all agree. */
  readonly differs?: readonly string[];
}

interface ConvergenceProps {
  readonly programs: readonly ConvergenceProgram[];
  readonly rounds: readonly ConvergenceRound[];
  readonly locale: SupportedLocale;
}

function ConvergenceDrawing({
  programs,
  rounds,
  locale,
  vertical,
}: ConvergenceProps & { readonly vertical: boolean }) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(vertical ? 350 : 700);
  const laneGap = vertical
    ? Math.min(80, (width - 40) / Math.max(1, programs.length - 1))
    : 34;
  const laneSpan = laneGap * (programs.length - 1);
  const longest = Math.max(...programs.map((program) => program.label.length));
  const labelSpace = vertical
    ? 30 + programs.length * 16
    : Math.max(100, Math.ceil(longest * 7.8) + 34);
  const roundGap = vertical
    ? 92
    : (width - labelSpace - 120) / Math.max(1, rounds.length);
  const height = vertical
    ? labelSpace + roundGap * rounds.length + 40
    : laneSpan + 120;
  const laneStart = vertical ? (width - laneSpan) / 2 : 56;
  const center = laneStart + laneSpan / 2;
  // progress runs along the rounds; lane across the programs
  const point = (progress: number, lane: number): [number, number] =>
    vertical ? [lane, progress] : [progress, lane];
  const progressOf = (round: number) => labelSpace + roundGap * (round + 0.5);
  const laneOf = (index: number) => laneStart + index * laneGap;

  const segments: { key: string; d: string; color: string }[] = [];
  const knots: { key: string; x: number; y: number; agree: boolean }[] = [];
  const leaves: { key: string; x: number; y: number; text: string }[] = [];

  programs.forEach((program, index) => {
    let previous = point(labelSpace - 20, laneOf(index));
    rounds.forEach((round, r) => {
      const differs = round.differs?.includes(program.id) ?? false;
      const away = index < programs.length / 2 ? -14 : 14;
      const lane = differs ? laneOf(index) + away : center;
      const next = point(progressOf(r), lane);
      let color: string = EX_HEX.holds;
      if (differs) color = EX_HEX.fails;
      segments.push({
        key: `${program.id}-${r}`,
        d: `M${previous[0].toFixed(1)} ${previous[1].toFixed(1)}L${next[0].toFixed(1)} ${next[1].toFixed(1)}`,
        color,
      });
      if (differs) {
        leaves.push({
          key: `${program.id}-${r}`,
          x: next[0],
          y: next[1],
          text: kt(locale, "explained.kit.converge.leaves", {
            who: program.label,
          }),
        });
      }
      previous = next;
    });
  });
  rounds.forEach((round, r) => {
    const [x, y] = point(progressOf(r), center);
    const differing = round.differs?.length ?? 0;
    knots.push({ key: `knot-${r}`, x, y, agree: differing === 0 });
  });

  return (
    <div
      ref={ref}
      className="tw-w-full tw-min-w-0"
      data-fig="convergence"
      data-layout={vertical ? "vertical" : "horizontal"}
    >
      <SvgFrame
        width={width}
        height={height}
        label={kt(locale, "explained.kit.converge.aria")}
      >
        {programs.map((program, index) => {
          const [x, y] = point(labelSpace - 24, laneOf(index));
          const left = index < programs.length / 2;
          return vertical ? (
            <Label
              key={program.id}
              x={left ? x - 4 : x + 4}
              y={14 + index * 16}
              anchor={left ? "start" : "end"}
              size={12}
              weight={600}
              tone="ink2"
            >
              {program.label}
            </Label>
          ) : (
            <Label
              key={program.id}
              x={x - 6}
              y={y + 4}
              anchor="end"
              size={13}
              weight={600}
              tone="ink2"
            >
              {program.label}
            </Label>
          );
        })}
        {rounds.map((round, r) => {
          const [x, y] = vertical
            ? [8, progressOf(r) + 4]
            : [progressOf(r), 16];
          return (
            <Label
              key={round.label}
              x={x}
              y={y}
              anchor={vertical ? "start" : "middle"}
            >
              {round.label}
            </Label>
          );
        })}
        {segments.map((segment) => (
          <path
            key={segment.key}
            d={segment.d}
            stroke={segment.color}
            strokeWidth={2}
            fill="none"
            opacity={0.9}
          />
        ))}
        {knots.map((knot) => (
          <circle
            key={knot.key}
            cx={knot.x}
            cy={knot.y}
            r={6}
            fill={knot.agree ? EX_HEX.holds : EX_HEX.panel}
            stroke={knot.agree ? EX_HEX.holds : EX_HEX.ink3}
            strokeWidth={1.5}
            data-agree={knot.agree ? "1" : "0"}
          />
        ))}
        {leaves.map((leave) => {
          // Beside the lane when the rounds run down; under it when across.
          const right = leave.x > width / 2;
          let x = leave.x;
          let anchor: "start" | "middle" | "end" = "middle";
          if (vertical) {
            x = leave.x + (right ? -8 : 8);
            anchor = right ? "end" : "start";
          }
          return (
            <g key={leave.key}>
              <circle cx={leave.x} cy={leave.y} r={4} fill={EX_HEX.fails} />
              <Label
                x={x}
                y={vertical ? leave.y + 4 : leave.y + 20}
                anchor={anchor}
                size={12}
                weight={600}
                tone="fails"
              >
                {leave.text}
              </Label>
            </g>
          );
        })}
      </SvgFrame>
    </div>
  );
}

/**
 * Left to right from `md` up, top to bottom on a phone: both are in the
 * page and CSS shows one, so the figure does not change shape as it loads.
 */
export default function Convergence(props: ConvergenceProps) {
  return (
    <>
      <div className="md:tw-hidden">
        <ConvergenceDrawing {...props} vertical />
      </div>
      <div className="max-md:tw-hidden">
        <ConvergenceDrawing {...props} vertical={false} />
      </div>
    </>
  );
}
