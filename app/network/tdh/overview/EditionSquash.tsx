"use client";

import { useEffect, useRef, useState } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import { Label, SvgFrame } from "@/components/explained/figures/svg";
import { useMeasuredWidth } from "@/components/explained/figures/useMeasuredWidth";
import { Slider } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { Icon } from "@/components/explained/marks/glyphs";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_FOCUS, EX_HEX } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { ENGINE } from "@/lib/explained/engine";
import { factFromSnapshot, type FactId } from "@/lib/explained/facts";
import { formatCents, formatCount } from "@/lib/explained/format";
import { ot } from "./copy";

/**
 * Squash the edition (the chapter's signature picture, moving): one
 * rectangle, copies across and the rate up, from the rarest edition to
 * FirstGM's. The rate is H divided by the edition, so as the rectangle
 * widens it flattens, and its area, the TDH a whole edition adds a day,
 * stays at H give or take the rate's rounding to a cent. The rates are the
 * TDH v1.4 engine's on today's H; nothing is typed.
 */
const HEIGHT = 230;
const PAD = { left: 10, right: 10, top: 26, bottom: 30 } as const;
const PLAY_MS = 2600;

function reducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function EditionSquash({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const snapshot = useFactSnapshot();
  const num = (id: FactId) => factFromSnapshot<number>(snapshot, id)?.value;
  const h = num("engine.H");
  const rare = num("meme.4.edition");
  const [copies, setCopies] = useState<number | null>(null);
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(640);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  if (h === undefined || rare === undefined || rare >= h) {
    return null;
  }
  const e = copies ?? rare;
  const rateCents = ENGINE.rateCents(h, e);
  const total = Math.round((e * rateCents) / 100);
  const maxRate = ENGINE.rateCents(h, rare) / 100;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + innerH;
  const xOf = (n: number) => PAD.left + (n / h) * innerW;
  const yOf = (rate: number) => baseY - (rate / maxRate) * innerH;
  const rectW = xOf(e) - PAD.left;
  const rectTop = yOf(rateCents / 100);
  const ghosts = [
    { copies: rare, rate: maxRate, label: ot(locale, "squash.rare") },
    {
      copies: h,
      rate: ENGINE.rateCents(h, h) / 100,
      label: ot(locale, "squash.firstGm"),
    },
  ];
  const play = () => {
    cancelAnimationFrame(frame.current);
    if (reducedMotion()) {
      setCopies(e >= h ? rare : h);
      return;
    }
    const from = e >= h ? rare : e;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / PLAY_MS);
      // The 6529 easing, as the kit's motion uses it.
      const eased = 1 - Math.pow(1 - t, 3);
      setCopies(Math.round(from + (h - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  const rateText = formatCents(locale, rateCents / 100);
  const label = ot(locale, "squash.aria", {
    copies: formatCount(locale, e),
    rate: rateText,
  });
  // The rectangle's own label: inside it when it is wide enough, else to
  // its right, never across its edge.
  const tag = ot(locale, "squash.tag", {
    copies: formatCount(locale, e),
    rate: rateText,
  });
  // Inside, it starts right of the rarest edition's outline, so no dashed
  // edge runs through it.
  const insideX = xOf(rare) + 8;
  const tagInside = PAD.left + rectW - insideX >= tag.length * 7.2 + 8;
  return (
    <Lens
      id="squash"
      label={ot(locale, "squash.label")}
      question={ot(locale, "squash.q")}
      broken={false}
      locale={locale}
      stage={
        <div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
            <div className="tw-min-w-[200px] tw-flex-1">
              <span className="tw-block tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-400">
                {ot(locale, "squash.copies")}
              </span>
              <Slider
                label={ot(locale, "squash.copies")}
                value={e}
                min={rare}
                max={h}
                attr="copies"
                valueText={ot(locale, "squash.valueText", {
                  copies: formatCount(locale, e),
                })}
                onChange={(value) => {
                  cancelAnimationFrame(frame.current);
                  setCopies(value);
                }}
              />
            </div>
            <button
              type="button"
              className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 hover:tw-bg-iron-900 ${EX_FOCUS}`}
              onClick={play}
              data-play=""
            >
              <Icon kind="play" className="tw-size-3.5" />
              {ot(locale, "squash.play")}
            </button>
          </div>
          <div
            ref={ref}
            className="tw-mt-4 tw-w-full tw-min-w-0"
            data-fig="squash"
          >
            <SvgFrame width={width} height={HEIGHT} label={label}>
              <line
                x1={PAD.left}
                y1={baseY}
                x2={PAD.left + innerW}
                y2={baseY}
                stroke={EX_HEX.line2}
              />
              {ghosts.map((ghost) => (
                <rect
                  key={ghost.label}
                  x={PAD.left}
                  y={yOf(ghost.rate)}
                  width={xOf(ghost.copies) - PAD.left}
                  height={baseY - yOf(ghost.rate)}
                  fill="none"
                  stroke={EX_HEX.ink4}
                  strokeDasharray="3 4"
                />
              ))}
              <rect
                x={PAD.left}
                y={rectTop}
                width={Math.max(1, rectW)}
                height={baseY - rectTop}
                fill="rgba(82,139,255,0.28)"
                stroke={EX_HEX.you}
                strokeWidth={1.5}
                data-squash-rect=""
              />
              <Label
                x={tagInside ? insideX : PAD.left + rectW + 8}
                y={Math.max(PAD.top - 8, rectTop - 8)}
                size={13}
                weight={600}
                tone="you"
              >
                {tag}
              </Label>
              <Label x={PAD.left} y={HEIGHT - 8}>
                {ot(locale, "squash.axisCopies")}
              </Label>
              <Label x={PAD.left + innerW} y={HEIGHT - 8} anchor="end">
                {ghosts[1]?.label ?? ""}
              </Label>
            </SvgFrame>
          </div>
        </div>
      }
      readout={
        <Readout
          big={formatCount(locale, total)}
          unit={ot(locale, "squash.unit")}
          say={ot(locale, "squash.say", {
            copies: formatCount(locale, e),
            rate: rateText,
            h: formatCount(locale, h),
          })}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[{ kind: "proposed", refText: "P26 §8.1" }]}
        />
      }
    />
  );
}
