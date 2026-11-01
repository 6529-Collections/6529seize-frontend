"use client";

import { useState, type ReactNode } from "react";
import { Seg } from "@/components/explained/lens/controls";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_BUTTON } from "@/components/explained/tokens";
import {
  DEFAULT_ANSWERS,
  SUGGESTION_ANCHOR,
  asksSpare,
  suggest,
  type Answer,
  type Answers,
  type Suggestion,
} from "./_lib/chooser";

/**
 * "Which machine should I use?" (the page's chooser): two or three yes-or-no
 * questions and one suggestion. Every suggestion is rendered on the server,
 * so the page copies and indexes whole; the browser only shows the one the
 * answers lead to. It opens on "Start with the computer you have", the
 * testing period's advice, and says its answers are starting ones until the
 * reader changes one.
 */
export interface ChooserResult {
  /** "Good", "Cloud VM": the tier or option's own name. */
  readonly name: string;
  readonly recommended: boolean;
  readonly title: string;
  readonly body: ReactNode;
  readonly cost: ReactNode;
  readonly more: string;
}

interface ChooserCopy {
  readonly title: string;
  readonly intro: string;
  /** Above the questions until the reader changes an answer. */
  readonly starting: string;
  /** Above the questions once the reader has changed one. */
  readonly yours: string;
  readonly where: string;
  readonly node: string;
  readonly nodeHint: string;
  readonly spare: string;
  readonly yes: string;
  readonly no: string;
  readonly result: string;
  readonly recommended: string;
}

function Question({
  id,
  text,
  hint,
  value,
  onChange,
  copy,
}: {
  readonly id: keyof Answers;
  readonly text: string;
  readonly hint?: string;
  readonly value: Answer;
  readonly onChange: (value: Answer) => void;
  readonly copy: ChooserCopy;
}) {
  return (
    <div
      className="tw-flex tw-flex-col tw-gap-2.5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-4 first:tw-border-t-0 first:tw-pt-0 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between sm:tw-gap-5"
      data-q={id}
    >
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-[15px] tw-font-semibold tw-leading-[22px] tw-text-iron-50">
          {text}
        </p>
        {hint !== undefined && (
          <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-[22px] tw-text-iron-400 md:tw-text-sm md:tw-leading-5">
            {hint}
          </p>
        )}
      </div>
      <div className="tw-flex-none [&_button]:tw-min-h-11 [&_button]:tw-min-w-[64px]">
        <Seg<Answer>
          label={text}
          options={[
            { value: "yes", label: copy.yes },
            { value: "no", label: copy.no },
          ]}
          value={value}
          onChange={onChange}
          attr="answer"
        />
      </div>
    </div>
  );
}

export default function MachineChooser({
  copy,
  results,
}: {
  readonly copy: ChooserCopy;
  readonly results: Readonly<Record<Suggestion, ChooserResult>>;
}) {
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [touched, setTouched] = useState(false);
  const set = (id: keyof Answers) => (value: Answer) => {
    setTouched(true);
    setAnswers((current) => ({ ...current, [id]: value }));
  };
  const picked = suggest(answers);

  return (
    <section
      aria-labelledby="chooser-title"
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 md:tw-p-6"
      data-lens="chooser"
      id="chooser"
    >
      <h2
        id="chooser-title"
        className="tw-m-0 tw-text-[21px] tw-font-semibold tw-leading-7 tw-tracking-[-0.012em] tw-text-iron-50 md:tw-text-[23px] md:tw-leading-[30px]"
      >
        {copy.title}
      </h2>
      <p className="tw-m-0 tw-mt-1.5 tw-text-[15px] tw-leading-[22px] tw-text-iron-400 md:tw-text-sm md:tw-leading-5">
        {copy.intro}
      </p>
      <p
        className="tw-m-0 tw-mt-4 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-primary-300"
        data-answers={touched ? "yours" : "starting"}
      >
        {touched ? copy.yours : copy.starting}
      </p>
      <div className="tw-mt-3">
        <Question
          id="where"
          text={copy.where}
          value={answers.where}
          onChange={set("where")}
          copy={copy}
        />
        <Question
          id="node"
          text={copy.node}
          hint={copy.nodeHint}
          value={answers.node}
          onChange={set("node")}
          copy={copy}
        />
        {asksSpare(answers) && (
          <Question
            id="spare"
            text={copy.spare}
            value={answers.spare}
            onChange={set("spare")}
            copy={copy}
          />
        )}
      </div>
      <div aria-live="polite" className="tw-mt-1">
        {(Object.keys(results) as Suggestion[]).map((key) => {
          const result = results[key];
          return (
            <div
              key={key}
              hidden={key !== picked}
              data-suggestion={key}
              className={`tw-rounded-xl tw-border tw-border-solid tw-p-4 md:tw-p-5 ${result.recommended ? "tw-border-primary-400/70 tw-bg-primary-400/[0.07]" : "tw-border-iron-700 tw-bg-black/20"}`}
            >
              <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
                <span>{copy.result}</span>
                <span aria-hidden="true">·</span>
                <span className="tw-text-iron-50">{result.name}</span>
                {result.recommended && (
                  <span className="tw-rounded-full tw-bg-primary-500 tw-px-2 tw-py-0.5 tw-text-[12px] tw-tracking-[0.1em] tw-text-white">
                    {copy.recommended}
                  </span>
                )}
              </p>
              <p className="tw-m-0 tw-mt-2.5 tw-text-lg tw-font-semibold tw-leading-6 tw-tracking-[-0.01em] tw-text-iron-50 md:tw-text-xl md:tw-leading-7">
                {result.title}
              </p>
              <p className="tw-m-0 tw-mt-1.5 tw-text-[15px] tw-leading-6 tw-text-iron-300 md:tw-text-base md:tw-leading-[26px]">
                {result.body}
              </p>
              <div className="tw-mt-3.5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
                <span className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
                  {result.cost}
                </span>
                <a href={SUGGESTION_ANCHOR[key]} className={EX_BUTTON.link}>
                  {result.more}
                  <Icon kind="arrow" className="tw-size-[15px]" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
