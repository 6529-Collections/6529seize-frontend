"use client";

import { useEffect, useRef, useState } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import { Label, SvgFrame } from "@/components/explained/figures/svg";
import { useMeasuredWidth } from "@/components/explained/figures/useMeasuredWidth";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
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
 * stays at H give or take the rate's rounding to a hundredth. The rates are the
 * TDH v1.4 engine's on today's H; nothing is typed.
 *
 * It opens on a middle edition, Meme #2's, with the rarest and the largest
 * outlined, so the equal areas are visible before Play. Break it: a card
 * still minting counts at its claim floor, so its copies so far, each at
 * the floor's rate, add less than every finished edition until the last
 * airdrop tops the release up. The newest card still minting when there is
 * one (Real); otherwise a release stopped halfway to the floor (What if).
 */
const HEIGHT = 230;
const PAD = { left: 10, right: 10, top: 26, bottom: 30 } as const;
const PLAY_MS = 2600;

interface Minting {
  readonly id: number | null;
  readonly minted: number;
  readonly edition: number;
}

/**
 * The newest Meme still minting below the threshold, counted at its floor;
 * else a what-if release stopped halfway to the floor.
 */
function mintingCard(
  rows: readonly (readonly number[])[] | undefined,
  threshold: number | undefined,
  cap: number | undefined
): Minting | null {
  if (threshold === undefined || cap === undefined) return null;
  const newest = (rows ?? []).reduce<readonly number[] | null>(
    (best, row) => ((row[0] ?? 0) > (best?.[0] ?? 0) ? row : best),
    null
  );
  if (newest) {
    const [id = 0, , minted = 0, edition = 0] = newest;
    if (minted > 0 && minted < threshold && edition > minted) {
      return { id, minted, edition };
    }
  }
  return { id: null, minted: Math.round(cap / 2), edition: cap };
}

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
  const middle = num("meme.2.edition");
  const minting = mintingCard(
    factFromSnapshot<number[][]>(snapshot, "memes.editions")?.value,
    num("rules.editionThreshold"),
    num("rules.editionFloorCap")
  );
  const [copies, setCopies] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(640);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  if (h === undefined || rare === undefined || rare >= h) {
    return null;
  }
  const opening =
    middle !== undefined && middle > rare && middle < h
      ? middle
      : Math.round((rare + h) / 2);
  const e = broken && minting ? minting.edition : (copies ?? opening);
  // The copies that exist: all of an edition, or a minting card's so far.
  const held = broken && minting ? minting.minted : e;
  const rateCents = ENGINE.rateCents(h, e);
  const total = Math.round((held * rateCents) / 100);
  const maxRate = ENGINE.rateCents(h, rare) / 100;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + innerH;
  const xOf = (n: number) => PAD.left + (n / h) * innerW;
  const yOf = (rate: number) => baseY - (rate / maxRate) * innerH;
  const rectW = xOf(held) - PAD.left;
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
    setBroken(false);
    if (reducedMotion()) {
      setCopies(e >= h ? rare : h);
      return;
    }
    const from = e >= h ? rare : e;
    const start = performance.now();
    setPlaying(true);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / PLAY_MS);
      // The 6529 easing, as the kit's motion uses it.
      const eased = 1 - Math.pow(1 - t, 3);
      setCopies(Math.round(from + (h - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setPlaying(false);
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
    copies: formatCount(locale, held),
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
      broken={broken}
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
                  setPlaying(false);
                  setBroken(false);
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
            // Play draws every frame itself; the slider's steps ease by the
            // shared rule only when Play is not running.
            {...(playing ? { "data-tweened": "" } : {})}
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
              {broken && minting && (
                // The edition the floor counts: the area the card will
                // have once the last airdrop tops it up.
                <rect
                  x={PAD.left}
                  y={rectTop}
                  width={xOf(e) - PAD.left}
                  height={baseY - rectTop}
                  fill="none"
                  stroke={EX_HEX.you}
                  strokeDasharray="4 3"
                  data-squash-floor=""
                />
              )}
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
          say={
            broken && minting
              ? ot(
                  locale,
                  minting.id === null
                    ? "squash.sayWhatIf"
                    : "squash.sayMinting",
                  {
                    id: minting.id ?? "",
                    minted: formatCount(locale, minting.minted),
                    edition: formatCount(locale, minting.edition),
                    rate: rateText,
                    total: formatCount(locale, total),
                  }
                )
              : ot(locale, "squash.say", {
                  copies: formatCount(locale, e),
                  rate: rateText,
                  h: formatCount(locale, h),
                })
          }
        />
      }
      {...(minting
        ? {
            breakIt: (
              <BreakIt
                id="minting"
                pressed={broken}
                onToggle={() => {
                  cancelAnimationFrame(frame.current);
                  setPlaying(false);
                  setBroken((value) => !value);
                }}
                label={breakItLabel(
                  locale,
                  ot(
                    locale,
                    minting.id === null ? "squash.breakWhatIf" : "squash.break",
                    { id: minting.id ?? "" }
                  )
                )}
              />
            ),
          }
        : {})}
      stamp={
        <StampLine
          locale={locale}
          // Two true marks, as How it works gives the rate rule: proposed as
          // the consensus rule, and live as 6529.io's rules today.
          marks={[
            { kind: "proposed", refText: "P26 §5.2, §8.1" },
            { maturity: "live" },
          ]}
          {...(broken && minting
            ? {
                tag: {
                  kind:
                    minting.id === null
                      ? ("whatIf" as const)
                      : ("real" as const),
                },
              }
            : {})}
        />
      }
    />
  );
}
