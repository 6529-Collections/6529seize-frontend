"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";

import { formatCount } from "./format";

export type HowItWorksStep = {
  readonly title: MessageKey;
  readonly text: MessageKey;
  readonly vars?: Readonly<Record<string, string>>;
};

/**
 * A numbered sale strip: a row of steps joined by a line on wider screens,
 * a stacked list with a line down the left on a phone.
 */
export function HowItWorksSteps({
  id,
  title,
  steps,
}: {
  readonly id: string;
  readonly title: MessageKey;
  readonly steps: readonly HowItWorksStep[];
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <h3 id={id} className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, title)}
      </h3>
      <ol aria-labelledby={id} className="tw-m-0 tw-grid tw-list-none tw-gap-0 tw-p-0 md:tw-grid-cols-4 md:tw-gap-4">
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          return (
            <li key={step.title} className="tw-flex tw-gap-3 md:tw-flex-col">
              <div aria-hidden="true" className="tw-flex tw-flex-col tw-items-center md:tw-w-full md:tw-flex-row">
                <span className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/60 tw-bg-primary-500/10 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-primary-300">
                  {formatCount(index + 1, locale)}
                </span>
                {last ? null : (
                  <span className="tw-my-1 tw-w-px tw-flex-1 tw-bg-white/15 md:tw-mx-2 md:tw-my-0 md:tw-h-px md:tw-w-auto" />
                )}
              </div>
              <div className={`tw-flex tw-min-w-0 tw-flex-col tw-gap-1 ${last ? "" : "tw-pb-5 md:tw-pb-0"}`}>
                <span className="tw-text-[15px] tw-font-semibold tw-text-iron-100">{t(locale, step.title)}</span>
                <span className="tw-text-sm tw-leading-6 tw-text-iron-400">{t(locale, step.text, step.vars)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
