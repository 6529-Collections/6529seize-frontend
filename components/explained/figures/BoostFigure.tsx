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
  const left = 8;
  const innerW = width - 16;
  const xAt = (boost: number) => left + ((boost - 1) / SPAN) * innerW;
  const wide = width > 520;
  // The track: a band tall enough to read as the boost's area, not a rule.
  const trackY = 34;
  const trackH = 44;
  const trackBottom = trackY + trackH;
  // The ceiling's label sits between the two lines: its long form needs
  // about 170 px there, its short form about 95 (a figure beside a rule
  // rail is narrower than a full-width one). Too narrow for either, it is
  // named in the key under the track instead, and its line still drawn.
  const gap = xAt(ceilingCents / 100) - xAt(todayMaxCents / 100);
  const ceilingKey =
    gap >= CEILING_LONG_PX
      ? "explained.kit.boost.ceiling"
      : "explained.kit.boost.ceilingShort";
  const ceilingText = kt(locale, ceilingKey, {
    value: formatCents(locale, ceilingCents / 100),
  });
  const markers = [
    {
      value: todayMaxCents / 100,
      solid: true,
      labelled: true,
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
      labelled: wide,
      text: ceilingText,
    },
  ];
  const beta = betaCents / 100;
  const valueX = xAt(Math.min(beta, ceilingCents / 100));
  const shown = parts.filter((part) => part.value > 0);
  const starts = offsets(
    shown.map((part) => part.value),
    1
  );
  // The key: one row a part, its swatch as drawn in the track; on a narrow
  // figure, the ceiling's dashed line last.
  const keyRows: { readonly text: string; readonly swatch: string | null }[] =
    shown.length === 0
      ? [{ text: kt(locale, "explained.kit.boost.none"), swatch: null }]
      : shown.map((part, index) => ({
          text: `${part.label} +${formatNumberParts(locale, part.value)}`,
          swatch: index % 2 ? "rgba(82,139,255,0.55)" : `url(#${hatchId})`,
        }));
  if (!wide) {
    keyRows.push({ text: ceilingText, swatch: "dashed" });
  }
  const keyTop = trackBottom + 44;
  const rowH = 20;
  const height = keyTop + keyRows.length * rowH;

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
          y={trackY}
          width={xAt(1 + SPAN) - xAt(1)}
          height={trackH}
          rx={4}
          fill={EX_HEX.raised}
        />
        {/* The scale: a faint line every quarter from 1.00, so a small
            boost reads against the whole track. */}
        {[1.25, 1.5, 1.75, 2].map((tick) => (
          <line
            key={tick}
            x1={xAt(tick)}
            y1={trackY}
            x2={xAt(tick)}
            y2={trackBottom}
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
              y={trackY}
              width={Math.max(1, x1 - x0)}
              height={trackH}
              fill={index % 2 ? "rgba(82,139,255,0.55)" : `url(#${hatchId})`}
              stroke={EX_HEX.you}
              strokeWidth={1}
              className={EX_MOTION.model}
            />
          );
        })}
        {markers.map((marker) => (
          <g key={marker.text}>
            <line
              x1={xAt(marker.value)}
              y1={26}
              x2={xAt(marker.value)}
              y2={trackBottom + 8}
              stroke={marker.solid ? EX_HEX.ink2 : EX_HEX.ink4}
              strokeDasharray={marker.solid ? undefined : "3 3"}
              strokeWidth={1.5}
            />
            {marker.labelled && (
              <Label
                x={xAt(marker.value) - 4}
                y={18}
                anchor="end"
                tone={marker.solid ? "ink2" : "ink3"}
              >
                {marker.text}
              </Label>
            )}
          </g>
        ))}
        {/* The origin: above the track's start when today's label leaves
            room for it, else under the track where the value leaves room. */}
        {xAt(todayMaxCents / 100) - 4 - (markers[0]?.text.length ?? 0) * 7.6 >
        xAt(1) + 40 ? (
          <Label x={xAt(1)} y={18} tone="ink3">
            {formatCents(locale, 1)}
          </Label>
        ) : (
          valueX - xAt(1) > 48 && (
            <Label x={xAt(1)} y={trackBottom + 24}>
              {formatCents(locale, 1)}
            </Label>
          )
        )}
        <line
          x1={valueX}
          y1={trackBottom}
          x2={valueX}
          y2={trackBottom + 8}
          stroke={EX_HEX.youInk}
          strokeWidth={1.5}
        />
        <Label
          x={Math.max(valueX, xAt(1) + 16)}
          y={trackBottom + 24}
          anchor={beta > 2 ? "end" : "middle"}
          size={13}
          weight={600}
          tone="you"
        >
          {formatCents(locale, beta)}
        </Label>
        {keyRows.map((row, index) => {
          const y = keyTop + index * rowH;
          return (
            <g key={row.text}>
              {row.swatch === "dashed" ? (
                <line
                  x1={xAt(1) + 5}
                  y1={y - 12}
                  x2={xAt(1) + 5}
                  y2={y + 2}
                  stroke={EX_HEX.ink4}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              ) : (
                row.swatch !== null && (
                  <rect
                    x={xAt(1)}
                    y={y - 11}
                    width={10}
                    height={10}
                    rx={2}
                    fill={row.swatch}
                    stroke={EX_HEX.you}
                    strokeWidth={1}
                  />
                )
              )}
              <Label x={xAt(1) + (row.swatch === null ? 0 : 18)} y={y}>
                {row.text}
              </Label>
            </g>
          );
        })}
      </SvgFrame>
    </div>
  );
}
