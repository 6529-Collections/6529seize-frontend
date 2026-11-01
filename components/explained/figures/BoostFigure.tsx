"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatNumberParts } from "./boostFormat";
import { kt } from "../i18n";
import { EX_HEX, EX_MOTION } from "../tokens";
import { Hatch, Label, offsets, SvgFrame } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * The boost ladder (TDH-DESIGN.md §5.6): the boost as parts stacked from
 * 1.00, today's highest as a solid line, the rule's ceiling dashed, the
 * value in blue, and the parts listed underneath. The parts are the
 * engine's; the figure draws them.
 */
export interface BoostPart {
  readonly label: string;
  /** In boost units: 0.80 for sixteen seasons. */
  readonly value: number;
}

const SPAN = 1.3;
/** Room the ceiling's long label needs between the two lines. */
const CEILING_LONG_PX = 170;

export default function BoostFigure({
  parts,
  betaCents,
  todayMaxCents,
  ceilingCents,
  locale,
  hatchId = "ex-boost-band",
}: {
  readonly parts: readonly BoostPart[];
  readonly betaCents: number;
  readonly todayMaxCents: number;
  readonly ceilingCents: number;
  readonly locale: SupportedLocale;
  readonly hatchId?: string;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(600);
  const height = 120;
  const left = 8;
  const innerW = width - 16;
  const xAt = (boost: number) => left + ((boost - 1) / SPAN) * innerW;
  const wide = width > 520;
  // The ceiling's label sits between the two lines: its long form needs
  // about 170 px there, its short form about 95 (a figure beside a rule
  // rail is narrower than a full-width one).
  const gap = xAt(ceilingCents / 100) - xAt(todayMaxCents / 100);
  const ceilingKey =
    gap >= CEILING_LONG_PX
      ? "explained.kit.boost.ceiling"
      : "explained.kit.boost.ceilingShort";
  const markers = [
    {
      value: todayMaxCents / 100,
      solid: true,
      text: wide
        ? kt(locale, "explained.kit.boost.today", {
            value: formatCents(locale, todayMaxCents / 100),
          })
        : kt(locale, "explained.kit.boost.todayShort", {
            value: formatCents(locale, todayMaxCents / 100),
          }),
    },
    {
      value: ceilingCents / 100,
      solid: false,
      text: kt(locale, ceilingKey, {
        value: formatCents(locale, ceilingCents / 100),
      }),
    },
  ];
  const beta = betaCents / 100;
  const valueX = xAt(Math.min(beta, ceilingCents / 100));
  const shown = parts.filter((part) => part.value > 0);
  const starts = offsets(
    shown.map((part) => part.value),
    1
  );
  const legend = shown
    .map((part) => `${part.label} +${formatNumberParts(locale, part.value)}`)
    .join("  ·  ");

  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="boost">
      <SvgFrame
        width={width}
        height={height}
        label={kt(locale, "explained.kit.boost.aria")}
      >
        <Hatch id={hatchId} />
        <rect
          x={xAt(1)}
          y={34}
          width={xAt(1 + SPAN) - xAt(1)}
          height={30}
          rx={4}
          fill={EX_HEX.raised}
        />
        {/* The scale: a faint line every quarter from 1.00, so a small
            boost reads against the whole track. */}
        {[1.25, 1.5, 1.75, 2].map((tick) => (
          <line
            key={tick}
            x1={xAt(tick)}
            y1={34}
            x2={xAt(tick)}
            y2={64}
            stroke={EX_HEX.line2}
            strokeWidth={1}
          />
        ))}
        {shown.map((part, index) => {
          const x0 = xAt(starts[index] ?? 1);
          const x1 = xAt((starts[index] ?? 1) + part.value);
          return (
            <rect
              key={part.label}
              x={x0}
              y={34}
              width={Math.max(1, x1 - x0)}
              height={30}
              fill={index % 2 ? "rgba(82,139,255,0.55)" : `url(#${hatchId})`}
              stroke={EX_HEX.you}
              strokeWidth={1}
              className={EX_MOTION.model}
            />
          );
        })}
        {markers.map((marker) =>
          marker.solid || wide ? (
            <g key={marker.text}>
              <line
                x1={xAt(marker.value)}
                y1={26}
                x2={xAt(marker.value)}
                y2={72}
                stroke={marker.solid ? EX_HEX.ink2 : EX_HEX.ink4}
                strokeDasharray={marker.solid ? undefined : "3 3"}
                strokeWidth={1.5}
              />
              <Label
                x={xAt(marker.value) - 4}
                y={18}
                anchor="end"
                tone={marker.solid ? "ink2" : "ink3"}
              >
                {marker.text}
              </Label>
            </g>
          ) : null
        )}
        {/* The origin, always: above the track's start, clear of the
            value under it and of the markers' labels at the right. */}
        <Label x={xAt(1)} y={18} tone="ink3">
          {formatCents(locale, 1)}
        </Label>
        <line
          x1={valueX}
          y1={64}
          x2={valueX}
          y2={72}
          stroke={EX_HEX.youInk}
          strokeWidth={1.5}
        />
        <Label
          x={Math.max(valueX, xAt(1) + 16)}
          y={86}
          anchor={beta > 2 ? "end" : "middle"}
          size={13}
          weight={600}
          tone="you"
        >
          {formatCents(locale, beta)}
        </Label>
        <Label x={xAt(1)} y={110}>
          {legend || kt(locale, "explained.kit.boost.none")}
        </Label>
      </SvgFrame>
    </div>
  );
}
