import type { ApiMonitoringSentryProjectOverview } from "@/generated/models/ApiMonitoringSentryProjectOverview";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import IssueList from "./sentry-issue-list";

type IssueCategory =
  | "high_priority"
  | "new_issues"
  | "regressed"
  | "escalating";
const CATEGORY_TITLES = {
  high_priority: "monitoring.sentry.highPriority",
  new_issues: "monitoring.sentry.newIssues",
  regressed: "monitoring.sentry.regressed",
  escalating: "monitoring.sentry.escalating",
} as const;
const CARD_CLASS =
  "tw-min-h-[13rem] tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4";
const SUMMARY_CLASS =
  "tw-cursor-pointer tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-300";

function categoryCount(
  project: ApiMonitoringSentryProjectOverview,
  category: IssueCategory
) {
  return category === "new_issues"
    ? { count: project.new_issues_total, exact: project.new_issues_count_exact }
    : { count: project[category].count, exact: project[category].count_exact };
}

function countLabel(
  projects: ApiMonitoringSentryProjectOverview[],
  category: IssueCategory,
  locale: SupportedLocale
) {
  const counts = projects.map((project) => categoryCount(project, category));
  const count = formatInteger(
    locale,
    counts.reduce((total, item) => total + item.count, 0)
  );
  return counts.every((item) => item.exact)
    ? count
    : t(locale, "monitoring.sentry.atLeast", { count });
}

function CategoryDetails({
  projects,
  category,
  locale,
}: {
  readonly projects: ApiMonitoringSentryProjectOverview[];
  readonly category: IssueCategory;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-mt-4 tw-space-y-5">
      {projects.map((project) => {
        const count = categoryCount(project, category);
        const issues =
          category === "new_issues"
            ? project.new_issues
            : project[category].issues;
        const hasMore =
          category === "new_issues"
            ? project.new_issues_has_more
            : project[category].has_more;
        return (
          <section
            key={project.project}
            aria-label={`${project.project} · ${t(locale, CATEGORY_TITLES[category])}`}
          >
            <h3 className="tw-mb-3 tw-break-words tw-text-base tw-font-semibold tw-text-iron-100">
              {project.project}
            </h3>
            {!count.exact && issues.length === 0 ? (
              <p className="tw-text-sm">
                {t(locale, "monitoring.sentry.partial")}
              </p>
            ) : (
              <IssueList
                title={t(locale, CATEGORY_TITLES[category])}
                issues={issues}
                hasMore={hasMore}
                locale={locale}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

function Trend({
  projects,
  locale,
}: {
  readonly projects: ApiMonitoringSentryProjectOverview[];
  readonly locale: SupportedLocale;
}) {
  const complete = projects.every(
    (project) =>
      project.event_trend.current_events !== null &&
      project.event_trend.previous_events !== null
  );
  if (!complete)
    return (
      <p className="tw-mb-0 tw-text-sm">
        {t(locale, "monitoring.sentry.trendUnavailable")}
      </p>
    );
  const current = projects.reduce(
    (total, project) => total + (project.event_trend.current_events ?? 0),
    0
  );
  const previous = projects.reduce(
    (total, project) => total + (project.event_trend.previous_events ?? 0),
    0
  );
  let label = t(locale, "monitoring.sentry.trendUnchanged");
  if (previous === 0 && current > 0)
    label = t(locale, "monitoring.sentry.trendNew");
  else if (current !== previous)
    label = t(
      locale,
      current > previous
        ? "monitoring.sentry.trendUp"
        : "monitoring.sentry.trendDown",
      {
        percent: formatPercent(locale, Math.abs(current - previous) / previous),
      }
    );
  return (
    <>
      <p className="tw-mb-2 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {formatInteger(locale, current)}
      </p>
      <p
        className={
          current > previous
            ? "tw-text-sm tw-text-error"
            : "tw-text-sm tw-text-iron-200"
        }
      >
        {label}
      </p>
      <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
        {t(locale, "monitoring.sentry.trendPrevious", {
          count: formatInteger(locale, previous),
        })}
      </p>
    </>
  );
}

export default function SentrySummary({
  projects,
  locale,
}: {
  readonly projects: ApiMonitoringSentryProjectOverview[];
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-space-y-3">
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-3 md:tw-grid-cols-3">
        <details className={CARD_CLASS}>
          <summary className={SUMMARY_CLASS}>
            <span className="tw-font-semibold">
              {t(locale, "monitoring.sentry.needsAttention")}
            </span>
            <span
              className={`tw-mt-3 tw-block tw-text-2xl tw-font-semibold ${projects.some((project) => project.high_priority.count > 0) ? "tw-text-error" : "tw-text-iron-50"}`}
            >
              {countLabel(projects, "high_priority", locale)}
            </span>
            <span className="tw-mt-2 tw-block tw-text-sm tw-text-iron-300">
              {t(locale, "monitoring.sentry.attentionDescription")}
            </span>
            <span className="tw-mt-3 tw-block tw-text-xs tw-text-primary-300">
              {t(locale, "monitoring.sentry.viewIssues")}
            </span>
          </summary>
          <CategoryDetails
            projects={projects}
            category="high_priority"
            locale={locale}
          />
        </details>
        <details className={CARD_CLASS}>
          <summary className={SUMMARY_CLASS}>
            <span className="tw-font-semibold">
              {t(locale, "monitoring.sentry.whatChanged")}
            </span>
            <span className="tw-mt-3 tw-block tw-text-sm">
              {t(locale, "monitoring.sentry.changes", {
                new: countLabel(projects, "new_issues", locale),
                regressed: countLabel(projects, "regressed", locale),
                escalating: countLabel(projects, "escalating", locale),
              })}
            </span>
            <span className="tw-mt-2 tw-block tw-text-xs tw-text-iron-400">
              {t(locale, "monitoring.sentry.changesDescription")}
            </span>
            <span className="tw-mt-3 tw-block tw-text-xs tw-text-primary-300">
              {t(locale, "monitoring.sentry.viewIssues")}
            </span>
          </summary>
          {(["new_issues", "regressed", "escalating"] as const).map(
            (category) => (
              <CategoryDetails
                key={category}
                projects={projects}
                category={category}
                locale={locale}
              />
            )
          )}
        </details>
        <section
          aria-label={t(locale, "monitoring.sentry.eventTrend")}
          className={CARD_CLASS}
        >
          <h3 className="tw-mb-3 tw-mt-0 tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "monitoring.sentry.eventTrend")}
          </h3>
          <Trend projects={projects} locale={locale} />
        </section>
      </div>
      <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
        {t(locale, "monitoring.sentry.overviewNote")}
      </p>
    </div>
  );
}
