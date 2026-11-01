"use client";

import { useState, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { EX_FOCUS } from "../tokens";

/**
 * A lens (EXPLAINED.md §8.1): one model, always in this order. The label
 * and the question in the reader's words; an optional Guess first; the
 * stage with its controls; the exact rule beside it (a rail on a desktop;
 * on a phone its lines in use, with one button for the rest); the readout,
 * a big number with its unit and one
 * sentence of why, read aloud as it changes; the footer with Break it and
 * one stamp line. Broken, the lens is rose-edged.
 */

export interface RuleLine {
  readonly text: ReactNode;
  /** The line in use, highlighted. */
  readonly on?: boolean;
}

const ON_LINE =
  "-tw-ml-3 tw-rounded-sm tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400 tw-bg-primary-400/[0.12] tw-pl-2.5 tw-text-iron-50";

export function RuleRail({
  lines,
  source,
  locale,
  open,
}: {
  readonly lines: readonly RuleLine[];
  readonly source: ReactNode;
  readonly locale: SupportedLocale;
  /** Shown on a phone. */
  readonly open: boolean;
}) {
  // On a phone, closed, the rail still shows the lines in use, so the rule
  // stays beside the model; the button opens the rest and the source.
  const anyOn = lines.some((line) => line.on);
  const closed = open ? "" : "max-md:tw-hidden";
  return (
    <div
      className={`tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black/20 tw-p-4 md:tw-border-l md:tw-border-t-0 md:tw-px-[22px] md:tw-py-5 ${anyOn ? "" : closed}`}
      data-rule-rail=""
      // The rule is code, not prose: in a narrow rail a formula wraps at its
      // tokens, and a short line of tokens is not a word left alone.
      data-tdh-check-ignore="one-word-lines"
    >
      <span className="tw-mb-2.5 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {kt(locale, "explained.kit.lens.rule")}
      </span>
      {lines.map((line, index) => {
        // A wrapped line hangs under its own first character, so a long
        // formula reads as one expression.
        const text = typeof line.text === "string" ? line.text : "";
        const hang = `${text.length - text.trimStart().length + 2}ch`;
        return (
          <div
            // The rule's lines are a fixed sequence.
            key={index}
            className={`tw-whitespace-break-spaces tw-py-0.5 tw-font-mono tw-text-[13px] tw-leading-[21px] md:tw-text-[13.5px] ${line.on ? ON_LINE : "tw-text-iron-400 " + closed}`}
            data-rule-on={line.on ? "1" : "0"}
          >
            <span
              className="tw-block [overflow-wrap:anywhere]"
              style={{ paddingLeft: hang, textIndent: `-${hang}` }}
            >
              {line.text}
            </span>
          </div>
        );
      })}
      <div
        className={`tw-mt-3 tw-text-[13px] tw-leading-5 tw-text-iron-400 ${closed}`}
      >
        {source}
      </div>
    </div>
  );
}

/** A value substituted into the rule: blue. */
export function RuleValue({ children }: { readonly children: ReactNode }) {
  return <span className="tw-text-primary-300">{children}</span>;
}

export function Readout({
  big,
  unit,
  say,
}: {
  readonly big: ReactNode;
  readonly unit?: string;
  readonly say: ReactNode;
}) {
  return (
    <div
      className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-px-4 tw-py-3.5 md:tw-grid-cols-[auto_minmax(0,1fr)] md:tw-gap-5 md:tw-px-[26px] md:tw-py-[18px]"
      data-readout=""
    >
      <span
        className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-text-[30px] tw-font-semibold tw-leading-[34px] tw-tracking-[-0.02em] tw-text-iron-50 md:tw-text-4xl md:tw-leading-10"
        aria-live="polite"
      >
        {/* A worded readout ("Recorded, and wrong") may wrap on a phone; a
            number never splits, having no space to break at. */}
        <span className="max-md:tw-whitespace-normal md:tw-whitespace-nowrap">
          {big}
        </span>
        {unit && (
          <small className="tw-text-[15px] tw-font-semibold tw-leading-6 tw-tracking-normal tw-text-iron-400">
            {unit}
          </small>
        )}
      </span>
      <p
        className="tw-m-0 tw-max-w-[600px] tw-text-base tw-leading-[25px] tw-text-iron-300"
        aria-live="polite"
      >
        {say}
      </p>
    </div>
  );
}

export function LensHead({
  label,
  question,
  locale,
  children,
}: {
  /** "A card ages": shown after "Model ·". */
  readonly label: string;
  readonly question: string;
  readonly locale: SupportedLocale;
  /** A Guess first, under the question. */
  readonly children?: ReactNode;
}) {
  return (
    <div className="tw-px-4 tw-pt-[18px] md:tw-px-[26px] md:tw-pt-6">
      <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {`${kt(locale, "explained.kit.lens.model")} · ${label}`}
      </span>
      <h3 className="tw-m-0 tw-mt-2 tw-max-w-[760px] tw-text-xl tw-font-semibold tw-leading-[27px] tw-tracking-[-0.012em] tw-text-iron-50 md:tw-text-2xl md:tw-leading-8">
        {question}
      </h3>
      {children}
    </div>
  );
}

export function Stage({ children }: { readonly children: ReactNode }) {
  return (
    <div
      className="tw-min-w-0 tw-p-4 md:tw-px-[26px] md:tw-py-[22px]"
      data-stage=""
    >
      {children}
    </div>
  );
}

export default function Lens({
  id,
  label,
  question,
  predict,
  stage,
  rule,
  readout,
  breakIt,
  stamp,
  broken,
  locale,
}: {
  /** `data-lens`: the model's id, for the gates' states. */
  readonly id: string;
  readonly label: string;
  readonly question: string;
  readonly predict?: ReactNode;
  /** The stage: controls and the figure. */
  readonly stage: ReactNode;
  readonly rule?: {
    readonly lines: readonly RuleLine[];
    readonly source: ReactNode;
  };
  readonly readout: ReactNode;
  readonly breakIt?: ReactNode;
  /** One stamp line (§3 rule 2). */
  readonly stamp: ReactNode;
  readonly broken: boolean;
  readonly locale: SupportedLocale;
}) {
  const [ruleOpen, setRuleOpen] = useState(false);
  return (
    <section
      className={`tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-bg-iron-950 ${broken ? "tw-border-error/45" : "tw-border-iron-800"}`}
      data-lens={id}
      data-broken={broken ? "1" : "0"}
      aria-label={label}
    >
      <LensHead label={label} question={question} locale={locale}>
        {predict}
      </LensHead>
      <div
        className={`tw-mt-5 tw-grid tw-grid-cols-1 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 ${rule ? "md:tw-grid-cols-[minmax(0,1fr)_340px] xl:tw-grid-cols-[minmax(0,1fr)_396px]" : ""}`}
      >
        <Stage>{stage}</Stage>
        {rule && (
          <RuleRail
            lines={rule.lines}
            source={rule.source}
            locale={locale}
            open={ruleOpen}
          />
        )}
      </div>
      {readout}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black/20 tw-px-4 tw-pb-3.5 tw-pt-3 md:tw-px-[26px] md:tw-pb-4 md:tw-pt-3.5">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3.5 tw-gap-y-2">
          {breakIt}
          {rule && (
            <button
              type="button"
              className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-semibold tw-text-primary-300 md:tw-hidden ${EX_FOCUS}`}
              aria-expanded={ruleOpen}
              onClick={() => setRuleOpen((value) => !value)}
              data-rule-toggle=""
            >
              <Icon kind="rule" className="tw-size-[15px]" />
              {kt(locale, "explained.kit.lens.rule")}
            </button>
          )}
        </div>
        {stamp}
      </div>
    </section>
  );
}
