import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import TdhStatusPill from "./shared/TdhStatusPill";
import { TDH_FOCUS_RING } from "./shared/tdhStyles";
import { formatCycleDate } from "./verification/components/verificationFormat";

const TERMS = [
  { key: "days", accent: "tw-border-t-sky-400" },
  { key: "rate", accent: "tw-border-t-iron-400" },
  { key: "boost", accent: "tw-border-t-fuchsia-400" },
  { key: "tdh", accent: "tw-border-t-primary-400" },
] as const;

/** Days × Rate × Boost = TDH, the whole rule in one line. */
function FormulaStrip({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "network.tdh.explainer.formula.label")}
      </figcaption>
      <p className="tw-sr-only">
        {t(locale, "network.tdh.explainer.formula.text")}
      </p>
      <div
        aria-hidden="true"
        className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] tw-items-start tw-gap-1.5 sm:tw-gap-2"
      >
        {TERMS.map((term, index) => (
          <div key={term.key} className="tw-contents">
            {index > 0 && (
              <span className="tw-pt-3.5 tw-text-center tw-text-xl tw-font-light tw-text-iron-500 sm:tw-text-2xl">
                {index === TERMS.length - 1 ? "=" : "×"}
              </span>
            )}
            <div
              className={`tw-min-w-0 tw-rounded-lg tw-border tw-border-t-2 tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-2 tw-py-3 tw-text-center sm:tw-px-3 ${term.accent}`}
            >
              <span className="tw-block tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
                {t(locale, `network.tdh.explainer.formula.${term.key}`)}
              </span>
              <span className="tw-mt-1 tw-block tw-text-[11px] tw-leading-4 tw-text-iron-400 sm:tw-text-xs">
                {t(locale, `network.tdh.explainer.formula.${term.key}Note`)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

function stripSentence(
  locale: SupportedLocale,
  summary: VerificationSummary
): string {
  if (summary.kind === "awaiting") {
    return t(locale, "network.tdh.explainer.strip.awaiting");
  }
  const date = formatCycleDate(locale, summary.date);
  const total = formatInteger(locale, summary.total ?? 0);
  if (
    summary.sentence === "none" &&
    summary.totalsEqual === true &&
    summary.equal !== null &&
    summary.equal === summary.total
  ) {
    return t(locale, "network.tdh.explainer.strip.equal", { date, total });
  }
  return t(locale, "network.tdh.explainer.strip.other", {
    date,
    equal: formatInteger(locale, summary.equal ?? 0),
    total,
  });
}

/**
 * The latest daily result in one line, near the top of the overview: the
 * proudest fact about TDH, and the way into the dashboard.
 */
function VerifiedStrip({
  locale,
  summary,
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary;
}) {
  const awaiting = summary.kind === "awaiting";
  const Icon = awaiting ? ClockIcon : CheckBadgeIcon;
  return (
    <Link
      href="/network/tdh/verification"
      className={`tw-group tw-mt-8 tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-success/30 tw-bg-success/[0.05] tw-px-4 tw-py-3.5 tw-no-underline tw-transition-colors hover:tw-border-success/60 motion-reduce:tw-transition-none sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-px-5 ${TDH_FOCUS_RING}`}
    >
      <span className="tw-flex tw-items-start tw-gap-3">
        <Icon
          aria-hidden="true"
          className={`tw-mt-0.5 tw-size-5 tw-shrink-0 ${awaiting ? "tw-text-iron-300" : "tw-text-success"}`}
        />
        <span className="tw-text-sm tw-leading-6 tw-text-iron-100 sm:tw-text-[15px]">
          {stripSentence(locale, summary)}
          {summary.kind === "sample" && (
            <span className="tw-ml-2 tw-inline-block tw-align-middle">
              <TdhStatusPill pill="sample" locale={locale} size="sm" />
            </span>
          )}
        </span>
      </span>
      <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-pl-8 tw-text-sm tw-font-medium tw-text-primary-300 sm:tw-pl-0">
        {t(locale, "network.tdh.explainer.strip.link")}
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
        />
      </span>
    </Link>
  );
}

/** The overview's header: what TDH is, the formula, and today's check. */
export default function TDHHero({
  locale,
  verification,
}: {
  readonly locale: SupportedLocale;
  readonly verification: VerificationSummary | null;
}) {
  return (
    <header className="tw-pb-10 tw-pt-6 sm:tw-pb-12 sm:tw-pt-10">
      <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:tw-items-end lg:tw-gap-12">
        <div>
          <h1 className="tw-m-0 tw-text-[2.5rem] tw-font-semibold tw-leading-none tw-tracking-tight tw-text-iron-50 sm:tw-text-6xl">
            {t(locale, "network.tdh.explainer.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-text-xl tw-font-medium tw-leading-8 tw-text-iron-50 sm:tw-text-2xl sm:tw-leading-9">
            {t(locale, "network.tdh.explainer.promise")}
          </p>
          <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-200 sm:tw-text-lg sm:tw-leading-8">
            {t(locale, "network.tdh.explainer.intro")}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
            {t(locale, "network.tdh.explainer.why")}
          </p>
        </div>
        <FormulaStrip locale={locale} />
      </div>
      {verification !== null && (
        <VerifiedStrip locale={locale} summary={verification} />
      )}
    </header>
  );
}
