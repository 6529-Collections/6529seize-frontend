"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import LoopFigure, { type LoopStation } from "../figures/LoopFigure";
import { Seg } from "../lens/controls";

/**
 * The loop on the hub (EXPLAINED.md §6.2): the figure, "Follow one copy"
 * stepping a copy round the stations, and the selected station's card with
 * its number and sentence. Desktop, a circle; phone, a list. With
 * `autoplay`, the copy goes round once when the loop first comes into view,
 * a second a station, unless the reader asks for reduced motion; any touch
 * of the loop stops it.
 */
const AUTOPLAY_STEP_MS = 1100;
export interface AtlasStation extends LoopStation {
  /** One sentence: what happens at this station. */
  readonly say: string;
  /**
   * The card's headline when it is not the station's number on the loop:
   * the copy's own value, so the first screen does not print one number
   * twice.
   */
  readonly head?: string;
}

export interface AtlasStep {
  /** "Minted", "Collected", "Held"… */
  readonly label: string;
  readonly station: string;
}

export default function LoopAtlas({
  id = "loop",
  stations,
  steps,
  initialStep,
  verify,
  actions,
  aside,
  note,
  tokenArt = null,
  autoplay = false,
  locale,
}: {
  /** `data-lens`, for the gates' states. */
  readonly id?: string;
  readonly stations: readonly AtlasStation[];
  readonly steps: readonly AtlasStep[];
  readonly initialStep: number;
  readonly verify: { readonly identities: string; readonly fact?: string };
  /**
   * The station card's action, by station key: "Chapter 01: TDH" for a
   * station with a live chapter, the coming chapter's name for the others.
   */
  readonly actions?: Readonly<Record<string, ReactNode>>;
  /** A panel under the loop and its card, full width: "Three things checked". */
  readonly aside?: ReactNode;
  /** A short note under the station card, in its column. */
  readonly note?: ReactNode;
  /** The travelling copy's art. */
  readonly tokenArt?: string | null;
  readonly autoplay?: boolean;
  readonly locale: SupportedLocale;
}) {
  const [step, setStep] = useState(initialStep);
  const sectionRef = useRef<HTMLElement>(null);
  const loopRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  // While the copy goes round by itself, the card does not announce each stop.
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const section = sectionRef.current;
    const loop = loopRef.current;
    if (
      !autoplay ||
      section === null ||
      loop === null ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }
    const order = [...steps.keys(), initialStep];
    let timer: number | undefined;
    let index = 0;
    const next = () => {
      if (touched.current || index >= order.length) {
        setPlaying(false);
        return;
      }
      setPlaying(true);
      setStep(order[index] ?? initialStep);
      index += 1;
      timer = window.setTimeout(next, AUTOPLAY_STEP_MS);
    };
    const stop = () => {
      touched.current = true;
      setPlaying(false);
    };
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          seen.disconnect();
          timer = window.setTimeout(next, AUTOPLAY_STEP_MS / 2);
        }
      },
      { threshold: 0.5 }
    );
    // The loop itself, not the whole section: "Three things checked" under
    // it makes the section taller than a screen.
    seen.observe(loop);
    section.addEventListener("pointerdown", stop);
    section.addEventListener("keydown", stop);
    return () => {
      seen.disconnect();
      section.removeEventListener("pointerdown", stop);
      section.removeEventListener("keydown", stop);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [autoplay, initialStep, steps]);
  const focus = steps[step]?.station ?? stations[0]?.key ?? "";
  const station = stations.find((entry) => entry.key === focus);
  const action = station ? actions?.[station.key] : undefined;
  return (
    <section data-lens={id} ref={sectionRef}>
      <div
        ref={loopRef}
        className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_380px] lg:tw-gap-10"
      >
        <div className="tw-min-w-0">
          <LoopFigure
            stations={stations}
            focus={focus}
            verify={verify}
            tokenArt={tokenArt}
            locale={locale}
          />
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2.5">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
              {kt(locale, "explained.kit.loop.follow")}
            </span>
            <Seg
              label={kt(locale, "explained.kit.loop.follow")}
              attr="step"
              phone="row"
              value={String(step)}
              onChange={(value) => {
                touched.current = true;
                setStep(Number(value));
              }}
              options={steps.map((entry, index) => ({
                value: String(index),
                label: `${index + 1} ${entry.label}`,
              }))}
            />
          </div>
        </div>
        <div className="tw-grid tw-gap-4 lg:tw-self-start xl:tw-mt-6">
          {station && (
            <div
              className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6"
              aria-live={playing ? "off" : "polite"}
              data-station-card={station.key}
            >
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-primary-300">
                {station.name}
              </span>
              <span
                className="tw-mt-2 tw-block tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-primary-300 max-[359px]:tw-text-xl"
                {...(station.fact && station.head === undefined
                  ? { "data-fact": station.fact }
                  : {})}
              >
                {station.head ?? station.num}
              </span>
              <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
                {station.say}
              </p>
              {action !== undefined && action !== null && (
                <div className="tw-mt-4">{action}</div>
              )}
            </div>
          )}
          {note}
        </div>
      </div>
      {aside !== undefined && aside !== null && (
        <div className="tw-mt-8 lg:tw-mt-10">{aside}</div>
      )}
    </section>
  );
}
