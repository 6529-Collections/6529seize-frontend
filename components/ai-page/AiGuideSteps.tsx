import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import type { AiGuideStep } from "@/lib/ai-page/content/guide";
import AiCodeBlock from "./AiCodeBlock";
import { AI_BODY } from "./AiPageFrame";
import InlineText from "./InlineText";

const RESULT =
  "tw-m-0 tw-border-0 tw-border-l-2 tw-border-solid tw-border-white/10 tw-pl-3 tw-text-sm tw-leading-6 tw-text-iron-400";

/**
 * What a step needs below its text: its commands, what the person sees
 * once it's done, an example of what it prints, and a screenshot.
 */
function AiStepDetails({
  step,
  screenshot,
}: {
  readonly step: AiGuideStep;
  readonly screenshot?: ReactNode;
}) {
  const hasDetails =
    step.code !== undefined ||
    step.result !== undefined ||
    step.example !== undefined ||
    screenshot !== undefined;
  if (!hasDetails) {
    return null;
  }
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
      {step.code?.map((block) => (
        <AiCodeBlock key={block.code} code={block.code} label={block.label} />
      ))}
      {screenshot}
      {step.result && (
        <p className={RESULT}>
          <InlineText text={step.result} />
        </p>
      )}
      {step.example && (
        <AiCodeBlock
          code={step.example}
          label={t(DEFAULT_LOCALE, "ai.code.example")}
          copy={false}
        />
      )}
    </div>
  );
}

/** A step's text, then its details: for a step outside a numbered list. */
export function AiStepBody({ step }: { readonly step: AiGuideStep }) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
      <p className={`tw-m-0 ${AI_BODY}`}>
        <InlineText text={step.text} />
      </p>
      <AiStepDetails step={step} />
    </div>
  );
}

/**
 * Numbered steps. The number sits beside the step's text; commands,
 * results and screenshots run below it, indented from 640 px and at full
 * width on a phone.
 */
export default function AiGuideSteps({
  steps,
  screenshots = {},
}: {
  readonly steps: readonly AiGuideStep[];
  /** Screenshots by the slot name a step asks for. */
  readonly screenshots?: Readonly<Record<string, ReactNode>>;
}) {
  return (
    <ol
      role="list"
      className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-6 tw-p-0"
    >
      {steps.map((step, index) => (
        <li key={step.text} className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-gap-3 sm:tw-gap-4">
            <span
              aria-hidden="true"
              className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300"
            >
              {index + 1}
            </span>
            <p className="tw-m-0 tw-pt-0.5 tw-text-[15px] tw-leading-6 tw-text-iron-100">
              <InlineText text={step.text} />
            </p>
          </div>
          <div className="empty:tw-hidden sm:tw-pl-11">
            <AiStepDetails
              step={step}
              screenshot={
                step.screenshot ? screenshots[step.screenshot] : undefined
              }
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
