"use client";

import { Children, useState, type ReactNode } from "react";
import { EX_FOCUS } from "@/components/explained/tokens";

/**
 * Why did my TDH change? Pick what happened (TDH-DESIGN.md §5.8): five
 * causes as buttons, one answer shown at a time. Every answer is rendered
 * on the server, so the page copies and indexes whole; the browser only
 * shows the one picked. A candidate for the kit (a `Picker`), with the
 * overview's Explain my TDH states.
 */
interface PickOption {
  readonly key: string;
  readonly label: string;
}

export default function WhyPicker({
  label,
  options,
  answers,
  footer,
}: {
  /** The group's accessible name: "What happened". */
  readonly label: string;
  readonly options: readonly PickOption[];
  /**
   * Each option's answer, by its key. A record, not a field of the options:
   * server elements inside an array prop reach the client as an unkeyed
   * list.
   */
  readonly answers: Readonly<Record<string, ReactNode>>;
  /** Under the answer, whichever is picked. */
  readonly footer?: ReactNode;
}) {
  const [picked, setPicked] = useState(options[0]?.key ?? "");
  return (
    <div
      className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-4 md:tw-grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:tw-gap-6"
      data-lens="picker"
    >
      <div className="tw-grid tw-gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const on = option.key === picked;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={on}
              data-pick={option.key}
              onClick={() => setPicked(option.key)}
              className={`tw-grid tw-min-h-11 tw-cursor-pointer tw-grid-cols-[20px_minmax(0,1fr)] tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-3.5 tw-text-left tw-text-base tw-leading-6 ${on ? "tw-border-primary-400 tw-bg-primary-400/[0.12] tw-text-iron-50" : "tw-border-iron-700 tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-600"} ${EX_FOCUS}`}
            >
              <span
                className={`tw-mt-[3px] tw-block tw-size-[18px] tw-rounded-full tw-border-2 tw-border-solid ${on ? "tw-border-primary-400 [background:radial-gradient(#528BFF_0_4px,transparent_5px)]" : "tw-border-iron-400"}`}
                aria-hidden="true"
              />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      <div className="tw-min-w-0">
        <div aria-live="polite">
          {options.map((option) => (
            <div
              key={option.key}
              hidden={option.key !== picked}
              data-ans={option.key}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-5 tw-py-5 md:tw-px-[22px]"
            >
              {/* An element from the server can arrive wrapped in a list;
                  toArray keys whatever it holds. */}
              {Children.toArray(answers[option.key])}
            </div>
          ))}
        </div>
        {footer}
      </div>
    </div>
  );
}
