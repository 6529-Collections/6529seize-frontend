"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { kt } from "../i18n";
import { EX_FILL, EX_HEX } from "../tokens";
import { Label, SvgFrame, px } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * The rate and the edition floor (TDH-DESIGN.md §5.5): rate = H ÷ E as a
 * dashed hyperbola, the floor zone below the threshold with its locked line,
 * reference editions as rectangles, the selected card's rectangle in blue,
 * and a rug of where the real cards sit. Every number is the engine's.
 */
export interface RateReference {
  readonly copies: number;
  readonly rateCents: number;
  readonly label: string;
}

const MAX_EDITION = 4000;
const MAX_RATE = 14;
const RUG_BIN = 25;

export default function RateFigure({
  h,
  threshold,
  lockedRef,
  references,
  selected,
  rug,
  locale,
}: {
  /** The largest effective edition: the hyperbola's numerator. */
  readonly h: number;
  /** No edition below it (D89). */
  readonly threshold: number;
  readonly lockedRef: string;
  readonly references: readonly RateReference[];
  readonly selected: { readonly copies: number; readonly rateCents: number };
  /** Every real card's effective edition. */
  readonly rug: readonly number[];
  readonly locale: SupportedLocale;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(600);
  const narrow = width < 560;
  const height = narrow ? 320 : 350;
  const pad = { left: 44, right: 14, top: 40, bottom: 74 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xAt = (edition: number) => pad.left + (edition / MAX_EDITION) * innerW;
  const yAt = (rate: number) => pad.top + innerH - (rate / MAX_RATE) * innerH;

  let curve = "";
  for (let edition = threshold - 18; edition <= MAX_EDITION; edition += 8) {
    curve += `${curve ? "L" : "M"}${xAt(edition).toFixed(1)} ${yAt(h / edition).toFixed(1)}`;
  }
  const xTicks = narrow
    ? [0, 1000, 2000, 3000, 4000]
    : [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
  const selectedRate = selected.rateCents / 100;
  const bins = new Map<number, number>();
  for (const edition of rug) {
    const bin = Math.round(edition / RUG_BIN) * RUG_BIN;
    bins.set(bin, (bins.get(bin) ?? 0) + 1);
  }
  const selectedBin = Math.round(selected.copies / RUG_BIN) * RUG_BIN;
  const rugY = height - 22;

  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="rates">
      <SvgFrame
        width={width}
        height={height}
        label={kt(locale, "explained.kit.rate.aria")}
      >
        <rect
          x={xAt(0)}
          y={pad.top}
          width={xAt(threshold) - xAt(0)}
          height={innerH}
          fill="rgba(255,255,255,0.03)"
        />
        <path
          d={curve}
          fill="none"
          stroke={EX_HEX.ink3}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        {references.map((reference) => (
          <rect
            key={reference.label}
            x={xAt(0)}
            y={yAt(reference.rateCents / 100)}
            width={xAt(reference.copies) - xAt(0)}
            height={yAt(0) - yAt(reference.rateCents / 100)}
            fill="none"
            stroke={EX_HEX.ink4}
          />
        ))}
        <rect
          x={xAt(0)}
          y={yAt(selectedRate)}
          width={Math.max(1, xAt(selected.copies) - xAt(0))}
          height={yAt(0) - yAt(selectedRate)}
          fill={EX_FILL.youArea}
          stroke={EX_HEX.you}
          strokeWidth={1.5}
        />
        <line
          x1={xAt(0)}
          y1={yAt(0)}
          x2={xAt(MAX_EDITION)}
          y2={yAt(0)}
          stroke={EX_HEX.line2}
        />
        <line
          x1={xAt(0)}
          y1={yAt(0)}
          x2={xAt(0)}
          y2={yAt(MAX_RATE)}
          stroke={EX_HEX.line2}
        />
        {xTicks.map((tick, index) => {
          let anchor: "start" | "middle" | "end" = "middle";
          if (index === 0) anchor = "start";
          if (index === xTicks.length - 1) anchor = "end";
          return (
            <Label key={tick} x={xAt(tick)} y={yAt(0) + 17} anchor={anchor}>
              {formatCount(locale, tick)}
            </Label>
          );
        })}
        <Label x={xAt(MAX_EDITION)} y={yAt(0) + 34} anchor="end">
          {kt(locale, "explained.kit.rate.axisX")}
        </Label>
        {[0, 4, 8, 12].map((tick) => (
          <Label key={tick} x={xAt(0) - 8} y={yAt(tick) + 4} anchor="end">
            {formatCount(locale, tick)}
          </Label>
        ))}
        <Label x={xAt(0) - 8} y={16}>
          {kt(locale, "explained.kit.rate.axisY")}
        </Label>
        <line
          x1={xAt(threshold)}
          y1={pad.top - 14}
          x2={xAt(threshold)}
          y2={yAt(0)}
          stroke={EX_HEX.ink2}
          strokeWidth={1.5}
        />
        <Label x={xAt(threshold) + 6} y={pad.top - 4} weight={600} tone="ink2">
          {narrow
            ? kt(locale, "explained.kit.rate.lockedShort", {
                threshold: formatCount(locale, threshold),
              })
            : kt(locale, "explained.kit.rate.locked", {
                threshold: formatCount(locale, threshold),
                ref: lockedRef,
              })}
        </Label>
        {references.map((reference, index) =>
          narrow && index > 0 ? null : (
            <Label
              key={`label-${reference.label}`}
              x={
                index === 0
                  ? xAt(reference.copies) - 4
                  : xAt(reference.copies) + 6
              }
              y={yAt(reference.rateCents / 100) - 6}
              anchor={index === 0 ? "end" : "start"}
            >
              {`${reference.label} ${formatCount(locale, reference.copies)} × ${formatCents(locale, reference.rateCents / 100)}`}
            </Label>
          )
        )}
        <Label
          x={xAt(Math.max(selected.copies, threshold)) + 10}
          y={Math.max(pad.top + 16, yAt(selectedRate) + 16)}
          size={13}
          weight={600}
          tone="you"
        >
          {`${formatCount(locale, selected.copies)} × ${formatCents(locale, selectedRate)}`}
        </Label>
        <Label x={xAt(0)} y={rugY - 6}>
          {kt(locale, "explained.kit.rate.cards", {
            count: formatCount(locale, rug.length),
          })}
        </Label>
        {[...bins.entries()].map(([bin, count]) => {
          const tall = px(Math.min(16, 3 + Math.log2(count + 1) * 2.4));
          return (
            <rect
              key={bin}
              x={xAt(bin) - 1}
              y={rugY + 16 - tall}
              width={2.2}
              height={tall}
              fill={bin === selectedBin ? EX_HEX.youInk : EX_HEX.ink3}
            />
          );
        })}
      </SvgFrame>
    </div>
  );
}
