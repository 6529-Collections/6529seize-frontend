import {
  ArrowRightIcon,
  BeakerIcon,
  CodeBracketIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { reportsAreLate } from "@/lib/tdh/verification/states";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import { formatCycleDate } from "./verification/components/verificationFormat";
import { TdhSourcesFootnote } from "./TDHInAMinute";
import TdhStatusPill from "./shared/TdhStatusPill";
import { TDH_FOCUS_RING } from "./shared/tdhStyles";
import TDHSection from "./TDHSection";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const POINTS: ReadonlyArray<{
  readonly key: "programs" | "formal" | "daily";
  readonly href: string;
  readonly icon: Icon;
}> = [
  {
    key: "programs",
    href: "/network/tdh/implementations",
    icon: CodeBracketIcon,
  },
  { key: "formal", href: "/network/tdh/formal", icon: ScaleIcon },
  { key: "daily", href: "/network/tdh/verification", icon: BeakerIcon },
];
const SOURCES = ["P26 §13", "D125", "D131", "D132"] as const;

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
    case "liveUnavailable":
    case "pending":
    case "unknown":
      return t(
        locale,
        `network.tdh.explainer.verified.${summary.sentence}` as MessageKey
      );
  }
}

function LatestCard({
  locale,
  summary,
  now,
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary;
  readonly now: Date;
}) {
  if (summary.kind === "awaiting") {
    return (
      <span className="tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(
          locale,
          reportsAreLate(now)
            ? "network.tdh.explainer.verified.awaitingLate"
            : "network.tdh.explainer.verified.awaiting"
        )}
      </span>
    );
  }
  return (
    <>
      <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <TdhStatusPill pill={summary.verdict} locale={locale} size="sm" />
        {summary.kind === "sample" && (
          <TdhStatusPill pill="sample" locale={locale} size="sm" />
        )}
      </span>
      {summary.equal !== null && summary.total !== null && (
        <span className="tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100">
          {t(
            locale,
            summary.afterCutover
              ? "network.tdh.explainer.verified.summaryAfter"
              : "network.tdh.explainer.verified.summary",
            {
              date: formatCycleDate(locale, summary.date),
              equal: formatInteger(locale, summary.equal),
              total: formatInteger(locale, summary.total),
            }
          )}{" "}
          {differenceSentence(locale, summary)}
        </span>
      )}
      {summary.kind === "sample" && (
        <span className="tw-text-xs tw-leading-5 tw-text-amber-200">
          {t(locale, "network.tdh.explainer.verified.sample")}
        </span>
      )}
    </>
  );
}

/**
 * The overview's "Checked daily, in public" section (plan §5.2): the three
 * reasons to trust the number, then the latest daily result. The card is
 * hidden when the data could not be loaded, so the overview never fails on
 * the dashboard's account.
 */
export default function TDHVerifiedDaily({
  locale,
  summary,
  now = new Date(),
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary | null;
  readonly now?: Date;
}) {
  return (
    <TDHSection
      id="tdh-verified"
      title={t(locale, "network.tdh.explainer.verified.title")}
    >
      <p className="tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-200">
        {t(locale, "network.tdh.explainer.verified.body")}
      </p>
      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-gap-3 tw-p-0 md:tw-grid-cols-3">
        {POINTS.map(({ key, href, icon: PointIcon }) => (
          <li key={key}>
            <Link
              href={href}
              className={`tw-group tw-flex tw-h-full tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 tw-no-underline tw-transition-colors hover:tw-border-primary-400/50 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`}
            >
              <span className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-iron-50">
                <PointIcon
                  aria-hidden="true"
                  className="tw-size-5 tw-shrink-0 tw-text-primary-300"
                />
                {t(locale, `network.tdh.explainer.verified.point.${key}.title`)}
              </span>
              <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, `network.tdh.explainer.verified.point.${key}.body`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {summary !== null && (
        <Link
          href="/network/tdh/verification"
          className={`tw-group tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-primary-400/50 motion-reduce:tw-transition-none sm:tw-flex-row sm:tw-items-center sm:tw-justify-between ${TDH_FOCUS_RING}`}
        >
          <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2">
            <LatestCard locale={locale} summary={summary} now={now} />
          </span>
          <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300">
            {t(locale, "network.tdh.explainer.verified.link")}
            <ArrowRightIcon
              aria-hidden="true"
              className="tw-size-4 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
            />
          </span>
        </Link>
      )}
      <TdhSourcesFootnote locale={locale} refs={SOURCES} legend={false} />
    </TDHSection>
  );
}
