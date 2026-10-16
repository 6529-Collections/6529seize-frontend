import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhHeading from "../shared/TdhHeading";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";
import TdhSourcesNote from "../shared/TdhSourcesNote";
import { noBreakTerms } from "../shared/noBreakTerms";

/** A numbered section of the specification page. */
export function SpecSection({
  id,
  title,
  locale,
  children,
  sources = [],
}: {
  readonly id: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  /**
   * What the section cites beyond its own P26 section: decisions,
   * deviations and other documents, in one closed disclosure at its end.
   */
  readonly sources?: readonly string[];
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-6 first:tw-border-t-0 first:tw-pt-0 sm:tw-py-8"
    >
      <TdhHeading
        id={id}
        title={title}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
      />
      {/* Prose keeps the measure; rule blocks and tables take the whole
          column, so no code line wraps on a desktop. */}
      <div className="tw-mt-4 tw-space-y-5">{children}</div>
      <TdhSourcesNote locale={locale} refs={sources} className="tw-mt-5" />
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
      className="tw-scroll-mt-24 tw-space-y-3 [&_[data-tdh-plain]]:tw-text-[15px] [&_[data-tdh-plain]]:tw-text-iron-200"
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
 * The rule in plain words, before the exact rule: set as the section's
 * lede, with no accent rule, so the blue edge marks normative text (the
 * exact rules) and nothing else. Its sources are in the section's one
 * Sources disclosure; the section number already names the P26 section.
 */
export function Plain({
  children,
}: {
  readonly locale?: SupportedLocale;
  readonly refs?: readonly string[];
  readonly children: ReactNode;
}) {
  return (
    <p
      data-tdh-plain=""
      className="tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-100"
    >
      {typeof children === "string" ? noBreakTerms(children) : children}
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

/**
 * A rule's details after its summary and exact rule: short items, each a
 * line or two, instead of one long paragraph.
 */
export function Details({
  id,
  items,
}: {
  readonly id?: string;
  readonly items: readonly string[];
}) {
  return (
    <ul
      id={id}
      className="tw-m-0 tw-max-w-[34rem] tw-scroll-mt-24 tw-list-disc tw-space-y-1.5 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-500"
    >
      {items.map((item) => (
        <li key={item}>{noBreakTerms(item)}</li>
      ))}
    </ul>
  );
}

/**
 * Text with `backticked` names set in mono: a rule written in English keeps
 * body type, and only its identifiers read as code.
 */
function withCode(text: string): ReactNode[] {
  return text.split("`").map((part, index) =>
    index % 2 === 1 ? (
      <code
        key={index}
        className="tw-rounded tw-bg-iron-900 tw-px-1 tw-font-mono tw-text-[0.9em] tw-text-iron-50"
      >
        {part}
      </code>
    ) : (
      <span key={index}>{noBreakTerms(part)}</span>
    )
  );
}

/**
 * A normative rule P26 writes in English, as a numbered list in body type
 * inside the exact rule's frame (the blue edge), with its identifiers in
 * mono: prose set in a code block reads as code and is hard to scan.
 */
export function ProseRule({
  locale,
  title,
  source,
  intro,
  steps,
}: {
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly source: string;
  readonly intro: string;
  readonly steps: readonly string[];
}) {
  return (
    // As wide as its text: a prose rule keeps the reading measure, so its
    // frame does too.
    <figure className="tw-m-0 tw-min-w-0 tw-max-w-[41rem] tw-overflow-hidden tw-rounded-lg tw-border tw-border-l-2 tw-border-solid tw-border-white/[0.07] tw-border-l-primary-400/70 tw-bg-iron-950">
      <figcaption className="tw-flex tw-min-h-9 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300">
        <span className="tw-min-w-0">{title}</span>
        <TdhSource refs={[source]} locale={locale} />
      </figcaption>
      <div className="tw-px-3 tw-py-3 sm:tw-px-4">
        <p className="tw-m-0 tw-max-w-[38em] tw-text-[15px] tw-leading-7 tw-text-iron-100">
          {withCode(intro)}
        </p>
        <ol className="tw-m-0 tw-mt-2 tw-max-w-[38em] tw-list-decimal tw-space-y-1.5 tw-pl-6 tw-text-[15px] tw-leading-7 tw-text-iron-100 marker:tw-text-iron-400">
          {steps.map((step) => (
            <li key={step} className="tw-pl-1">
              {withCode(step)}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
