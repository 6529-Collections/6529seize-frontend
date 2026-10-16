import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhHeading from "../shared/TdhHeading";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";

/** A numbered section of the specification page. */
export function SpecSection({
  id,
  title,
  locale,
  children,
  wide = false,
}: {
  readonly id: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  /** Content across the whole column, for a table that needs the room. */
  readonly wide?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 first:tw-border-t-0 first:tw-pt-0 sm:tw-py-10"
    >
      <TdhHeading
        id={id}
        title={title}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
      />
      {/* Prose keeps its own measure (Plain, PROSE); rule blocks and
          tables take the whole column, so fewer code lines wrap. */}
      <div className={`tw-mt-4 tw-space-y-5 ${wide ? "" : "tw-max-w-[60rem]"}`}>
        {children}
      </div>
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
    <div
      id={id}
      className="tw-scroll-mt-24 tw-space-y-3 [&_[data-tdh-plain]]:tw-border-l-0 [&_[data-tdh-plain]]:tw-pl-0 [&_[data-tdh-plain]]:tw-text-[15px] [&_[data-tdh-plain]]:tw-text-iron-200"
    >
      <TdhHeading
        id={id}
        title={title}
        locale={locale}
        level={3}
        className="tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
      />
      {children}
    </div>
  );
}

/**
 * The rule in plain words, before the exact rule. A section's summary is set
 * as its lede, with a primary rule at its side; inside a subsection the same
 * paragraph is ordinary prose (SpecSub drops the rule), so thirteen sections
 * do not read as one long quotation.
 */
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
    <p
      data-tdh-plain=""
      className="tw-m-0 tw-max-w-3xl tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/50 tw-pl-4 tw-text-base tw-leading-7 tw-text-iron-100"
    >
      {children}
      {refs.length > 0 && <TdhSource refs={refs} locale={locale} />}
    </p>
  );
}

export function Rule({
  locale,
  code,
  source,
  moreSources,
  title,
  condensed = false,
  aligned = false,
}: {
  readonly locale: SupportedLocale;
  readonly code: string;
  readonly source: string;
  /** Further sections the block draws on. */
  readonly moreSources?: readonly string[];
  readonly title?: string;
  /** P26's prose rules restated line for line, not quoted pseudocode. */
  readonly condensed?: boolean;
  /** Column-aligned: never wrapped, scrolls sideways when too wide. */
  readonly aligned?: boolean;
}) {
  const heading =
    title ?? (condensed ? t(locale, "network.tdh.shared.ruleCondensed") : null);
  return (
    <div className="tw-min-w-0">
      <TdhRuleBlock
        code={code}
        source={source}
        {...(moreSources ? { moreSources } : {})}
        locale={locale}
        tone={condensed ? "condensed" : "exact"}
        {...(aligned ? { wrap: "none" as const } : {})}
        {...(heading ? { title: heading, label: heading } : {})}
      />
    </div>
  );
}
