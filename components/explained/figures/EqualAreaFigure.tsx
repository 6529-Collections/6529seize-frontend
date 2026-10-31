"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { kt } from "../i18n";
import { EX_FILL, EX_HEX } from "../tokens";
import { Label, offsets, SvgFrame } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * Every edition has the same area (EXPLAINED.md §4.1, TDH-DESIGN.md §5.2):
 * each card's copies drawn to scale on one baseline, width copies, height
 * rate. Tall and narrow for a rare card, low and wide for FirstGM; all about
 * H a day. On a phone each edition gets its own row.
 */
export interface EditionArea {
  readonly name: string;
  /** Effective edition, from the engine. */
  readonly copies: number;
  readonly rateCents: number;
  /** The reader's card, or the one the text is about: drawn blue. */
  readonly you?: boolean;
}

const MIN_SLOT = 150;
const GAP = 36;

function slotScale(items: readonly EditionArea[], available: number): number {
  let scale = available / items.reduce((sum, item) => sum + item.copies, 0);
  // Narrow editions keep a label's width; the rest share what is left.
  for (let pass = 0; pass < 8; pass += 1) {
    let fixed = 0;
    let flexible = 0;
    for (const item of items) {
      if (item.copies * scale < MIN_SLOT) fixed += MIN_SLOT;
      else flexible += item.copies;
    }
    scale = flexible > 0 ? (available - fixed) / flexible : scale;
  }
  return scale;
}

interface EqualProps {
  readonly items: readonly EditionArea[];
  readonly locale: SupportedLocale;
}

function texts(items: readonly EditionArea[], locale: SupportedLocale) {
  const area = (item: EditionArea) =>
    Math.round((item.copies * item.rateCents) / 100);
  return {
    label: kt(locale, "explained.kit.equal.aria"),
    maxRate: Math.max(...items.map((item) => item.rateCents / 100)),
    fill: (item: EditionArea) =>
      item.you ? EX_FILL.youArea : EX_FILL.neutralArea,
    stroke: (item: EditionArea) => (item.you ? EX_HEX.you : EX_HEX.ink3),
    copiesText: (item: EditionArea) =>
      kt(locale, "explained.kit.equal.copies", {
        copies: formatCount(locale, item.copies),
        rate: formatCents(locale, item.rateCents / 100),
      }),
    perDay: (item: EditionArea) =>
      kt(locale, "explained.kit.equal.perDay", {
        area: formatCount(locale, area(item)),
      }),
  };
}

/** From `lg` up: one baseline, each edition to scale, all about the same area. */
function EqualWide({ items, locale }: EqualProps) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(900);
  const t = texts(items, locale);
  const scaleX = slotScale(items, width - GAP * (items.length - 1));
  const scaleY = 220 / t.maxRate;
  const height = 330;
  const base = 268;
  const lefts = offsets(
    items.map((item) => Math.max(item.copies * scaleX, MIN_SLOT) + GAP)
  );
  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="equal">
      <SvgFrame width={width} height={height} label={t.label}>
        {items.map((item, index) => {
          const w = item.copies * scaleX;
          const h = (item.rateCents / 100) * scaleY;
          const top = Math.min(base - h - 30, base - 50);
          const at = lefts[index] ?? 0;
          return (
            <g key={item.name}>
              <rect
                x={at}
                y={base - h}
                width={w}
                height={h}
                fill={t.fill(item)}
                stroke={t.stroke(item)}
                strokeWidth={1.5}
              />
              <Label x={at} y={top} size={15} weight={600} tone="ink1">
                {item.name}
              </Label>
              <Label x={at} y={top + 19} size={13} tone="ink2">
                {t.copiesText(item)}
              </Label>
              <Label
                x={at}
                y={base + 24}
                size={13}
                weight={600}
                tone={item.you ? "you" : "ink2"}
              >
                {t.perDay(item)}
              </Label>
            </g>
          );
        })}
        <line x1={0} y1={base} x2={width} y2={base} stroke={EX_HEX.line2} />
        <Label x={width} y={base + 52} anchor="end">
          {kt(locale, "explained.kit.equal.axis")}
        </Label>
      </SvgFrame>
    </div>
  );
}

/** Below this width the per-day area moves under the copies, off the name's line. */
const ROWS_STACK_WIDTH = 320;

/** On a phone: one row per edition, the widest edition the full width. */
function EqualRows({ items, locale }: EqualProps) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(350);
  const t = texts(items, locale);
  const maxCopies = Math.max(...items.map((item) => item.copies));
  const scaleX = (width - 4) / maxCopies;
  const scaleY = 150 / t.maxRate;
  const stack = width < ROWS_STACK_WIDTH;
  const head = stack ? 65 : 46;
  const height =
    items.reduce(
      (sum, item) => sum + (item.rateCents / 100) * scaleY + head + 18,
      0
    ) + 20;
  const tops = offsets(
    items.map((item) => (item.rateCents / 100) * scaleY + head + 18)
  );
  return (
    <div ref={ref} className="tw-w-full tw-min-w-0" data-fig="equal">
      <SvgFrame width={width} height={height} label={t.label}>
        {items.map((item, index) => {
          const h = (item.rateCents / 100) * scaleY;
          const at = tops[index] ?? 0;
          return (
            <g key={item.name}>
              <Label x={0} y={at + 16} size={15} weight={600} tone="ink1">
                {item.name}
              </Label>
              <Label
                x={stack ? 0 : width}
                y={stack ? at + 54 : at + 16}
                anchor={stack ? "start" : "end"}
                size={13}
                weight={600}
                tone={item.you ? "you" : "ink2"}
              >
                {t.perDay(item)}
              </Label>
              <Label x={0} y={at + 35} size={13} tone="ink2">
                {t.copiesText(item)}
              </Label>
              <rect
                x={0}
                y={at + head}
                width={Math.max(2, item.copies * scaleX)}
                height={h}
                fill={t.fill(item)}
                stroke={t.stroke(item)}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </SvgFrame>
    </div>
  );
}

/**
 * Both layouts are in the page and CSS shows one, so the figure does not
 * change shape when it hydrates.
 */
export default function EqualAreaFigure(props: EqualProps) {
  return (
    <>
      <div className="lg:tw-hidden">
        <EqualRows {...props} />
      </div>
      <div className="max-lg:tw-hidden">
        <EqualWide {...props} />
      </div>
    </>
  );
}
