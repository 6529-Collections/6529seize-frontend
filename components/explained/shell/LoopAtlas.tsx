"use client";

import { useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import LoopFigure, { type LoopStation } from "../figures/LoopFigure";
import { Seg } from "../lens/controls";

/**
 * The loop on the hub (EXPLAINED.md §6.2): the figure, "Follow one copy"
 * stepping a copy round the stations, and the selected station's card with
 * its number and sentence. Desktop, a circle; phone, a list.
 */
export interface AtlasStation extends LoopStation {
  /** One sentence: what happens at this station. */
  readonly say: string;
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
  readonly locale: SupportedLocale;
}) {
  const [step, setStep] = useState(initialStep);
  const focus = steps[step]?.station ?? stations[0]?.key ?? "";
  const station = stations.find((entry) => entry.key === focus);
  const action = station ? actions?.[station.key] : undefined;
  return (
    <section data-lens={id}>
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_380px] lg:tw-gap-10">
        <div className="tw-min-w-0">
          <LoopFigure
            stations={stations}
            focus={focus}
            verify={verify}
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
              onChange={(value) => setStep(Number(value))}
              options={steps.map((entry, index) => ({
                value: String(index),
                label: `${index + 1} ${entry.label}`,
              }))}
            />
          </div>
        </div>
        {station && (
          <div
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6 lg:tw-sticky lg:tw-top-24"
            aria-live="polite"
            data-station-card={station.key}
          >
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-primary-300">
              {station.name}
            </span>
            <span
              className="tw-mt-2 tw-block tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-primary-300 max-[359px]:tw-text-xl"
              {...(station.fact ? { "data-fact": station.fact } : {})}
            >
              {station.num}
            </span>
            <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {station.say}
            </p>
            {action !== undefined && action !== null && (
              <div className="tw-mt-4">{action}</div>
            )}
          </div>
        )}
      </div>
      {aside !== undefined && aside !== null && (
        <div className="tw-mt-8 lg:tw-mt-10">{aside}</div>
      )}
    </section>
  );
}
