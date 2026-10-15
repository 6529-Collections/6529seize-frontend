import type { ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhHeadingLink from "../shared/TdhHeadingLink";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";
import { TDH_FOCUS_RING } from "../shared/tdhStyles";

/** One numbered step of How TDH is calculated. */
export default function StepSection({
  locale,
  step,
  title,
  pills,
  rule,
  ruleSource,
  children,
}: {
  readonly locale: SupportedLocale;
  readonly step: number;
  readonly title: string;
  readonly pills?: ReactNode;
  readonly rule?: string;
  readonly ruleSource?: string;
  readonly children: ReactNode;
}) {
  const id = `step-${step}`;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 first:tw-border-t-0 first:tw-pt-0 sm:tw-py-10"
    >
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-primary-300">
        {t(locale, "network.tdh.how.stepLabel", {
          n: formatInteger(locale, step),
        })}
      </p>
      <div className="tw-mt-1 tw-flex tw-items-start tw-gap-1">
        <h2
          id={`${id}-heading`}
          tabIndex={-1}
          className="tw-m-0 tw-pt-2 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none sm:tw-text-2xl"
        >
          {title}
        </h2>
        <TdhHeadingLink
          id={id}
          label={t(locale, "network.tdh.shared.headingLink", {
            heading: title,
          })}
          copiedLabel={t(locale, "network.tdh.shared.linkCopied")}
        />
      </div>
      {pills !== undefined && (
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">{pills}</div>
      )}
      <div className="tw-mt-4 tw-max-w-3xl tw-space-y-4">{children}</div>
      {rule && (
        <details className="tw-group tw-mt-5 tw-max-w-3xl">
          <summary
            className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-300 hover:tw-text-iron-50 [&::-webkit-details-marker]:tw-hidden ${TDH_FOCUS_RING}`}
          >
            <span
              aria-hidden="true"
              className="tw-inline-block tw-text-iron-500 tw-transition-transform group-open:tw-rotate-90 motion-reduce:tw-transition-none"
            >
              ›
            </span>
            {t(locale, "network.tdh.shared.rule")}
          </summary>
          <div className="tw-mt-2">
            <TdhRuleBlock
              code={rule}
              locale={locale}
              {...(ruleSource ? { source: ruleSource } : {})}
            />
          </div>
        </details>
      )}
    </section>
  );
}

/** A paragraph of prose followed by its source chips. */
export function Cited({
  locale,
  refs,
  children,
  muted = false,
}: {
  readonly locale: SupportedLocale;
  readonly refs: readonly string[];
  readonly children: ReactNode;
  readonly muted?: boolean;
}) {
  return (
    <p
      className={`tw-m-0 tw-text-[15px] tw-leading-7 ${muted ? "tw-text-iron-400" : "tw-text-iron-200"}`}
    >
      {children}
      {refs.length > 0 && <TdhSource refs={refs} locale={locale} />}
    </p>
  );
}

/** A labelled example block. */
export function Example({
  locale,
  children,
}: {
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-bg-iron-900/60 tw-py-3 tw-pl-4 tw-pr-3">
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
        {t(locale, "network.tdh.how.example")}
      </p>
      <div className="tw-mt-1 tw-space-y-3 tw-text-[15px] tw-leading-7 tw-text-iron-200">
        {children}
      </div>
    </div>
  );
}
