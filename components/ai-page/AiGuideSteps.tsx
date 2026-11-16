import type { AiGuideStep } from "@/lib/ai-page/content/guide";
import AiCodeBlock from "./AiCodeBlock";
import { AI_BODY } from "./AiPageFrame";
import InlineText from "./InlineText";

/** What to do, its commands, and what the person sees once it's done. */
export function AiStepBody({ step }: { readonly step: AiGuideStep }) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-3">
      <p className={`tw-m-0 ${AI_BODY} tw-text-iron-100`}>
        <InlineText text={step.text} />
      </p>
      {step.code?.map((block) => (
        <AiCodeBlock key={block.code} code={block.code} label={block.label} />
      ))}
      {step.result && (
        <p className="tw-m-0 tw-border-0 tw-border-l-2 tw-border-solid tw-border-white/10 tw-pl-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          <InlineText text={step.result} />
        </p>
      )}
    </div>
  );
}

/** Numbered steps, one after another. */
export default function AiGuideSteps({
  steps,
}: {
  readonly steps: readonly AiGuideStep[];
}) {
  return (
    <ol
      role="list"
      className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-6 tw-p-0"
    >
      {steps.map((step, index) => (
        <li key={step.text} className="tw-flex tw-gap-4">
          <span
            aria-hidden="true"
            className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300"
          >
            {index + 1}
          </span>
          <AiStepBody step={step} />
        </li>
      ))}
    </ol>
  );
}
