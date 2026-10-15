import type { ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhHeadingLink from "../shared/TdhHeadingLink";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";

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
          className="tw-m-0 tw-pt-1.5 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none sm:tw-text-[1.75rem]"
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

/**
 * A paragraph of prose with its source chips. On wide screens the chips sit
 * in the right margin beside the paragraph, like margin notes; on narrower
 * ones they follow it on a row of their own, so a chip never ends up alone
 * on a line of text.
 */
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
    <div className="xl:-tw-mr-[8rem] xl:tw-grid xl:tw-grid-cols-[minmax(0,1fr)_6.5rem] xl:tw-gap-6">
      <p
        className={`tw-m-0 tw-text-[15px] tw-leading-7 ${muted ? "tw-text-iron-400" : "tw-text-iron-200"}`}
      >
        {children}
      </p>
      {refs.length > 0 && (
        <TdhSource
          refs={refs}
          locale={locale}
          block
          className="tw-mt-1 xl:tw-mt-1 xl:tw-flex-col xl:tw-items-start"
        />
      )}
    </div>
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
