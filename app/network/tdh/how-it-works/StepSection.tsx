import type { ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhHeading from "../shared/TdhHeading";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";

/**
 * One numbered step of How TDH is calculated. The step's sources sit on one
 * line at its end, not beside every paragraph, so the prose reads as prose.
 */
export default function StepSection({
  locale,
  step,
  title,
  pills,
  rule,
  ruleSource,
  sources = [],
  children,
}: {
  readonly locale: SupportedLocale;
  readonly step: number;
  readonly title: string;
  readonly pills?: ReactNode;
  readonly rule?: string;
  readonly ruleSource?: string;
  /** Every source the step's prose rests on, in order of first use. */
  readonly sources?: readonly string[];
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
      <TdhHeading
        id={id}
        title={title}
        locale={locale}
        className="tw-mt-1 tw-hyphens-auto tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
      />
      {pills !== undefined && (
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">{pills}</div>
      )}
      <div className="tw-mt-4 tw-max-w-3xl tw-space-y-4">{children}</div>
      {sources.length > 0 && (
        <p className="tw-m-0 tw-mt-4 tw-flex tw-max-w-3xl tw-flex-wrap tw-items-center tw-gap-x-1 tw-gap-y-1 tw-text-xs tw-text-iron-400">
          <span className="tw-mr-1 tw-font-medium tw-text-iron-300">
            {t(locale, "network.tdh.explainer.sources.label")}
          </span>
          <TdhSource refs={sources} locale={locale} block />
        </p>
      )}
      {rule && (
        <TdhDisclosure
          className="tw-mt-5 tw-max-w-3xl"
          tone="strong"
          summary={t(locale, "network.tdh.shared.rule")}
        >
          <div className="tw-mt-1">
            <TdhRuleBlock
              code={rule}
              locale={locale}
              {...(ruleSource ? { source: ruleSource } : {})}
            />
          </div>
        </TdhDisclosure>
      )}
    </section>
  );
}

/** A paragraph of a step's prose; its sources are on the step's line. */
export function Cited({
  children,
  muted = false,
}: {
  readonly locale?: SupportedLocale;
  readonly children: ReactNode;
  readonly muted?: boolean;
}) {
  return (
    <p
      className={`tw-m-0 tw-text-[15px] tw-leading-7 ${muted ? "tw-text-iron-400" : "tw-text-iron-200"}`}
    >
      {children}
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
