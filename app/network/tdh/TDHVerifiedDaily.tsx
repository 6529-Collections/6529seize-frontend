import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import { formatCycleDate } from "./verification/components/verificationFormat";
import TdhSource from "./shared/TdhSource";
import TdhStatusPill from "./shared/TdhStatusPill";
import { TDH_FOCUS_RING } from "./shared/tdhStyles";
import TDHSection from "./TDHSection";

function differenceSentence(
  locale: SupportedLocale,
  summary: Extract<VerificationSummary, { kind: "data" | "sample" }>
): string {
  const count = formatInteger(locale, summary.differenceCount);
  const plural =
    selectPluralCategory(locale, summary.differenceCount) === "one"
      ? "one"
      : "other";
  switch (summary.sentence) {
    case "none":
      return t(locale, "network.tdh.explainer.verified.none");
    case "explained":
    case "investigating":
      return t(
        locale,
        `network.tdh.explainer.verified.${summary.sentence}.${plural}` as MessageKey,
        { count }
      );
    case "mismatch":
      return t(locale, "network.tdh.explainer.verified.mismatch");
    case "pending":
      return t(locale, "network.tdh.explainer.verified.pending");
    case "unknown":
      return t(locale, "network.tdh.explainer.verified.unknown");
  }
}

/**
 * The overview's "Verified daily" strip (plan §5.2). Hidden when the data
 * could not be loaded: the overview never fails on the dashboard's account.
 */
export default function TDHVerifiedDaily({
  locale,
  summary,
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary | null;
}) {
  if (summary === null) {
    return null;
  }
  return (
    <TDHSection
      id="tdh-verified"
      title={t(locale, "network.tdh.explainer.verified.title")}
    >
      <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.explainer.verified.body")}
        <TdhSource refs={["D121", "D132"]} locale={locale} />
      </p>
      <Link
        href="/network/tdh/verification"
        className={`tw-group tw-mt-5 tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900 tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-primary-400/50 motion-reduce:tw-transition-none sm:tw-flex-row sm:tw-items-center sm:tw-justify-between ${TDH_FOCUS_RING}`}
      >
        <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2">
          {summary.kind === "awaiting" ? (
            <span className="tw-text-sm tw-leading-6 tw-text-iron-200">
              {t(locale, "network.tdh.explainer.verified.awaiting")}
            </span>
          ) : (
            <>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <TdhStatusPill
                  pill={summary.verdict}
                  locale={locale}
                  size="sm"
                />
                {summary.kind === "sample" && (
                  <TdhStatusPill pill="sample" locale={locale} size="sm" />
                )}
              </span>
              <span className="tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100">
                {t(
                  locale,
                  summary.afterCutover
                    ? "network.tdh.explainer.verified.summaryAfter"
                    : "network.tdh.explainer.verified.summary",
                  {
                    cycle: formatInteger(locale, summary.cycleDay),
                    date: formatCycleDate(locale, summary.date),
                    equal: formatInteger(locale, summary.equal),
                    total: formatInteger(locale, summary.total),
                  }
                )}{" "}
                {differenceSentence(locale, summary)}
              </span>
              {summary.kind === "sample" && (
                <span className="tw-text-xs tw-text-amber-200">
                  {t(locale, "network.tdh.explainer.verified.sample")}
                </span>
              )}
            </>
          )}
        </span>
        <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300">
          {t(locale, "network.tdh.explainer.verified.link")}
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-size-4 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
          />
        </span>
      </Link>
    </TDHSection>
  );
}
