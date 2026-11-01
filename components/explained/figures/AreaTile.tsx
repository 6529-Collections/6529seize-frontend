"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { kt } from "../i18n";
import { EX_HEX } from "../tokens";
import { Hatch, Label, SvgFrame, Tile } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * The signature (EXPLAINED.md §4.1): one copy's TDH as an area. Width is
 * whole days held, on a 200, 400, 800 or 1,600-day axis chosen to fit;
 * height is the card's rate on 0 to 14, the frame growing when the boost
 * needs more room, so the band is always drawn to scale; the boost is one
 * hatched band across the top. A copy that left is drawn as the area it
 * took with it, dashed in rose. The numbers are the engine's; the figure
 * only draws them.
 */
const AREA_DAY_AXES = [200, 400, 800, 1600] as const;
const MAX_RATE = 14;
const HEIGHT = 164;
const PAD = { left: 2, right: 2, top: 10, bottom: 26 } as const;
/** Narrower than this, the reference's label cannot be read whole, so it is not drawn. */
const REFERENCE_MIN_WIDTH = 280;

export function dayAxisFor(days: number): number {
  return AREA_DAY_AXES.find((axis) => axis >= days * 1.15) ?? 1600;
}

export default function AreaTile({
  days,
  rateCents,
  betaCents,
  tdh,
  locale,
  reference,
  hatchId = "ex-area-band",
  lostDays,
}: {
  readonly days: number;
  readonly rateCents: number;
  readonly betaCents: number;
  /** The copy's TDH, from the engine. */
  readonly tdh: number;
  readonly locale: SupportedLocale;
  /** A taller card to compare against when this one is short: a 310-copy card. */
  readonly reference?: { readonly copies: number; readonly rateCents: number };
  readonly hatchId?: string;
  /** The days a sold copy had: drawn as the area that left with it. */
  readonly lostDays?: number;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(480);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const axis = dayAxisFor(Math.max(days, lostDays ?? 0));
  const rate = rateCents / 100;
  // The scale's top: the rate axis's 14, or more when rate × boost needs it,
  // so the band is never clipped and keeps its true height.
  const top = Math.max(MAX_RATE, ((rate * betaCents) / 100) * 1.06);
  const tileW = Math.max(0, (days / axis) * innerW);
  const tileH = (rate / top) * innerH;
  const bandH = (tileH * (betaCents - 100)) / 100;
  const baseY = PAD.top + innerH;
  const label = kt(locale, "explained.kit.area.aria", {
    days: formatCount(locale, days),
    rate: formatCents(locale, rate),
  });

  const ticks = [0, 0.5, 1].map((fraction) => ({
    fraction,
    value: axis * fraction,
  }));
  const showReference =
    reference !== undefined && rate < 10 && width >= REFERENCE_MIN_WIDTH;
  const referenceY = reference
    ? baseY - (reference.rateCents / 100 / top) * innerH
    : 0;
  const lostW =
    lostDays !== undefined && lostDays > 0 ? (lostDays / axis) * innerW : 0;

  let tdhLabel = null;
  if (tileW > 0) {
    const right = PAD.left + tileW + 8 > width - 150;
    const x = right ? PAD.left + tileW - 8 : PAD.left + tileW + 8;
    const top = baseY - tileH - bandH;
    const y = top - 6 < 24 ? baseY - 8 : top - 8;
    tdhLabel = (
      <Label
        x={x}
        y={y}
        anchor={right ? "end" : "start"}
        size={13}
        weight={600}
        tone={right ? "ink1" : "you"}
      >
        {kt(locale, "explained.kit.area.tdh", {
          tdh: formatCount(locale, tdh),
        })}
      </Label>
    );
  }

  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="area">
      <SvgFrame width={width} height={HEIGHT} label={label}>
        <Hatch id={hatchId} />
        <line
          x1={PAD.left}
          y1={baseY}
          x2={PAD.left + innerW}
          y2={baseY}
          stroke={EX_HEX.line2}
        />
        {/* The rate axis, 0 to 14: faint lines at its middle and its top, so
            a short card reads as short against the scale. */}
        {[MAX_RATE / 2, MAX_RATE].map((value) => {
          const y = baseY - (value / top) * innerH;
          return (
            <g key={value} aria-hidden="true">
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + innerW}
                y2={y}
                stroke={EX_HEX.line}
              />
            </g>
          );
        })}
        {showReference && (
          <g>
            <line
              x1={PAD.left}
              y1={referenceY}
              x2={PAD.left + innerW}
              y2={referenceY}
              stroke={EX_HEX.ink4}
              strokeDasharray="3 4"
            />
            <Label x={PAD.left + innerW} y={referenceY - 6} anchor="end">
              {kt(locale, "explained.kit.area.reference", {
                copies: formatCount(locale, reference.copies),
                rate: formatCents(locale, reference.rateCents / 100),
              })}
            </Label>
          </g>
        )}
        {ticks.map(({ fraction, value }) => {
          const x = PAD.left + fraction * innerW;
          let anchor: "start" | "middle" | "end" = "middle";
          if (fraction === 0) anchor = "start";
          if (fraction === 1) anchor = "end";
          return (
            <g key={fraction}>
              <line
                x1={x}
                y1={baseY}
                x2={x}
                y2={baseY + 4}
                stroke={EX_HEX.ink4}
              />
              <Label x={x} y={HEIGHT - 8} anchor={anchor}>
                {fraction === 1
                  ? kt(locale, "explained.kit.area.days", {
                      days: formatCount(locale, value),
                    })
                  : formatCount(locale, value)}
              </Label>
            </g>
          );
        })}
        {lostW > 0 && (
          <g data-area-lost="">
            <rect
              x={PAD.left}
              y={baseY - tileH - bandH}
              width={lostW}
              height={tileH + bandH}
              fill="rgba(249,112,102,0.10)"
              stroke={EX_HEX.fails}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <Label
              x={PAD.left + Math.min(lostW, innerW) / 2}
              y={Math.max(18, baseY - tileH - bandH - 8)}
              anchor="middle"
              size={13}
              weight={600}
              tone="fails"
            >
              {kt(locale, "explained.kit.area.lost", {
                days: formatCount(locale, lostDays ?? 0),
              })}
            </Label>
          </g>
        )}
        {tileW > 0 ? (
          <Tile
            x={PAD.left}
            y={baseY - tileH}
            width={tileW}
            height={tileH}
            you
            band={{ height: bandH, hatch: hatchId }}
          />
        ) : lostW > 0 ? null : (
          <Label
            x={PAD.left + 8}
            y={baseY - 10}
            size={13}
            weight={600}
            tone="ink2"
          >
            {kt(locale, "explained.kit.area.none", {
              days: formatCount(locale, 0),
            })}
          </Label>
        )}
        {tdhLabel}
      </SvgFrame>
    </div>
  );
}
