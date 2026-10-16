import type { ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhHeading from "../shared/TdhHeading";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSource from "../shared/TdhSource";
import { noBreakTerms } from "../shared/noBreakTerms";
import { TDH_MEASURE } from "../shared/tdhStyles";

/**
 * One numbered step of How TDH is calculated. The step's sources and its
 * exact rule share one disclosure at its end, so the prose reads as prose
 * and fourteen steps do not each end in a row of chips.
 */
export default function StepSection({
  locale,
  step,
  title,
  pills,
  rule,
  ruleSource,
  ruleNote,
  sources = [],
  children,
}: {
  readonly locale: SupportedLocale;
  readonly step: number;
  readonly title: string;
  readonly pills?: ReactNode;
  readonly rule?: string;
  readonly ruleSource?: string;
  /** The rule's detail in prose: shown with the rule, not in the step. */
  readonly ruleNote?: string;
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
        className="tw-mt-1 tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
      />
      {pills !== undefined && (
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">{pills}</div>
      )}
      {/* Blocks snap to the measure (prose, notes, examples, small
          tables) or to the full column (explorables, wide tables). */}
      <div className="tw-mt-4 tw-space-y-4">{children}</div>
      {(rule !== undefined || sources.length > 0) && (
        <TdhDisclosure
          className="tw-mt-5"
          tone="strong"
          summary={t(
            locale,
            disclosureLabel(rule !== undefined, sources.length > 0)
          )}
        >
          <div className="tw-mt-1 tw-space-y-3">
            {ruleNote !== undefined && (
              <p
                className={`tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300 ${TDH_MEASURE}`}
              >
                {ruleNote}
              </p>
            )}
            {sources.length > 0 && (
              <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1 tw-gap-y-1 tw-text-sm tw-text-iron-400">
                <span className="tw-mr-1 tw-font-medium tw-text-iron-300">
                  {t(locale, "network.tdh.explainer.sources.label")}
                </span>
                <TdhSource refs={sources} locale={locale} block />
              </p>
            )}
            {rule !== undefined && (
              <TdhRuleBlock
                code={rule}
                locale={locale}
                {...(ruleSource ? { source: ruleSource } : {})}
              />
            )}
          </div>
        </TdhDisclosure>
      )}
    </section>
  );
}

/** The step disclosure's label: what it holds. */
function disclosureLabel(hasRule: boolean, hasSources: boolean): MessageKey {
  if (!hasRule) {
    return "network.tdh.how.sourcesOnly";
  }
  return hasSources
    ? "network.tdh.how.ruleAndSources"
    : "network.tdh.shared.rule";
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
      className={`tw-m-0 tw-text-base tw-leading-7 ${TDH_MEASURE} ${muted ? "tw-text-iron-300" : "tw-text-iron-200"}`}
    >
      {typeof children === "string" ? noBreakTerms(children) : children}
    </p>
  );
}

/**
 * A labelled example block, in a neutral frame: the blue rule is kept for
 * normative code. At the measure, or the full column when it holds a table
 * and a drawing side by side.
 */
export function Example({
  locale,
  children,
  wide = false,
}: {
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  readonly wide?: boolean;
}) {
  return (
    <div
      className={`tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900/60 tw-px-4 tw-py-3 ${wide ? "" : TDH_MEASURE}`}
    >
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
        {t(locale, "network.tdh.how.example")}
      </p>
      <div className="tw-mt-1 tw-space-y-3 tw-text-base tw-leading-7 tw-text-iron-200">
        {children}
      </div>
    </div>
  );
}

/** A one-line note under a table or diagram: a detail, never a paragraph. */
export function Note({ children }: { readonly children: ReactNode }) {
  return (
    <p
      className={`tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400 ${TDH_MEASURE}`}
    >
      {typeof children === "string" ? noBreakTerms(children) : children}
    </p>
  );
}

/** A caution in a step: the limit of a rule, set off in amber. */
export function Caution({ children }: { readonly children: ReactNode }) {
  return (
    <p
      className={`tw-m-0 tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200 ${TDH_MEASURE}`}
    >
      {typeof children === "string" ? noBreakTerms(children) : children}
    </p>
  );
}

/** A small table, or any block read at the measure. */
export function Measure({ children }: { readonly children: ReactNode }) {
  return <div className={TDH_MEASURE}>{children}</div>;
}
