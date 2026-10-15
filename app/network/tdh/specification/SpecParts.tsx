import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhHeadingLink from "../shared/TdhHeadingLink";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";

/** A numbered section of the specification page. */
export function SpecSection({
  id,
  title,
  locale,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 first:tw-border-t-0 first:tw-pt-0 sm:tw-py-10"
    >
      <div className="tw-flex tw-items-start tw-gap-1">
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
      <div className="tw-mt-4 tw-max-w-3xl tw-space-y-5">{children}</div>
    </section>
  );
}

/** A subsection with its own anchor, such as `#s5-2`. */
export function SpecSub({
  id,
  title,
  locale,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
}) {
  return (
    <div id={id} className="tw-scroll-mt-24 tw-space-y-3">
      <div className="tw-flex tw-items-center tw-gap-1">
        <h3
          id={`${id}-heading`}
          tabIndex={-1}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50 focus:tw-outline-none"
        >
          {title}
        </h3>
        <TdhHeadingLink
          id={id}
          label={t(locale, "network.tdh.shared.headingLink", {
            heading: title,
          })}
          copiedLabel={t(locale, "network.tdh.shared.linkCopied")}
        />
      </div>
      {children}
    </div>
  );
}

/** "In plain words" beside the exact rule. */
export function Plain({
  locale,
  refs,
  children,
}: {
  readonly locale: SupportedLocale;
  readonly refs: readonly string[];
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-max-w-3xl">
      <p className="tw-m-0 tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
        <span
          aria-hidden="true"
          className="tw-size-1.5 tw-rounded-full tw-bg-primary-400"
        />
        {t(locale, "network.tdh.spec.plain")}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-7 tw-text-iron-200">
        {children}
        {refs.length > 0 && <TdhSource refs={refs} locale={locale} />}
      </p>
    </div>
  );
}

export function Rule({
  locale,
  code,
  source,
  title,
  condensed = false,
}: {
  readonly locale: SupportedLocale;
  readonly code: string;
  readonly source: string;
  readonly title?: string;
  /** P26's prose rules restated line for line, not quoted pseudocode. */
  readonly condensed?: boolean;
}) {
  const heading =
    title ?? (condensed ? t(locale, "network.tdh.shared.ruleCondensed") : null);
  return (
    <div className="tw-max-w-3xl">
      <TdhRuleBlock
        code={code}
        source={source}
        locale={locale}
        tone={condensed ? "condensed" : "exact"}
        {...(heading ? { title: heading, label: heading } : {})}
      />
    </div>
  );
}

/** A note that a rule is settled in the text: green, because it is in P26. */
export function SettledNote({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-success/30 tw-bg-success/[0.06] tw-px-4 tw-py-3 tw-text-sm tw-leading-6 tw-text-iron-200 sm:tw-flex-row sm:tw-items-start">
      {children}
    </div>
  );
}
