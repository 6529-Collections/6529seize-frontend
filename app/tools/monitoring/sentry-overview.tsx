import { ApiMonitoringSentryOverviewStatusEnum } from "@/generated/models/ApiMonitoringSentryOverview";
import type { ApiMonitoringSentryOverview } from "@/generated/models/ApiMonitoringSentryOverview";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";

import IssueList, { DATE_OPTIONS } from "./sentry-issue-list";
import SentrySummary from "./sentry-summary";

export default function SentryOverview({
  overview,
  locale,
  children,
}: {
  readonly overview: ApiMonitoringSentryOverview;
  readonly locale: SupportedLocale;
  readonly children?: ReactNode;
}) {
  return (
    <div className="tw-space-y-5">
      <div>
        <h2 className="tw-mb-2 tw-text-xl tw-font-semibold tw-text-iron-50">
          {t(locale, "monitoring.sentry.title")}
        </h2>
        <p className="tw-m-0 tw-text-sm">
          {overview.status ===
          ApiMonitoringSentryOverviewStatusEnum.NotConfigured
            ? t(locale, "monitoring.sentry.notConfigured")
            : t(locale, "monitoring.sentry.period", {
                environment: overview.environment,
              })}
        </p>
      </div>
      {overview.status === ApiMonitoringSentryOverviewStatusEnum.Ready ? (
        <>
          <SentrySummary projects={overview.projects} locale={locale} />
          {children}
          <details className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-4">
            <summary className="tw-cursor-pointer tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-300">
              {t(locale, "monitoring.sentry.allDetails")}
            </summary>
            {overview.projects.map((project) => (
              <section
                key={project.project}
                aria-label={project.project}
                className="tw-space-y-4 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-5"
              >
                <h3 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-50">
                  {project.project}
                </h3>
                <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-2">
                  <IssueList
                    title={t(locale, "monitoring.sentry.newIssues")}
                    issues={project.new_issues}
                    hasMore={project.new_issues_has_more}
                    locale={locale}
                  />
                  <IssueList
                    title={t(locale, "monitoring.sentry.topIssues")}
                    issues={project.top_issues}
                    hasMore={project.top_issues_has_more}
                    locale={locale}
                  />
                </div>
              </section>
            ))}
          </details>
          <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-4 tw-text-xs tw-text-iron-400">
            <p>
              {t(locale, "monitoring.sentry.updated", {
                date: formatDate(locale, overview.fetched_at, DATE_OPTIONS),
              })}
            </p>
            <p className="tw-mb-0">{t(locale, "monitoring.sentry.cache")}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
