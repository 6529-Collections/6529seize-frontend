import type { ApiMonitoringSentryIssue } from "@/generated/models/ApiMonitoringSentryIssue";
import { ApiMonitoringSentryIssuePriorityEnum } from "@/generated/models/ApiMonitoringSentryIssue";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const DATE_OPTIONS = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

export default function IssueList({
  title,
  issues,
  hasMore,
  locale,
}: {
  readonly title: string;
  readonly issues: ApiMonitoringSentryIssue[];
  readonly hasMore: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <section aria-label={title} className="tw-min-w-0">
      <h4 className="tw-mb-3 tw-text-base tw-font-semibold tw-text-iron-100">
        {title}
      </h4>
      {issues.length === 0 ? (
        <p className="tw-text-sm">{t(locale, "monitoring.sentry.empty")}</p>
      ) : (
        <ol className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4"
            >
              <p className="tw-mb-2 tw-break-words tw-text-xs tw-text-iron-400">
                {issue.project} · {issue.short_id}
              </p>
              <p className="tw-mb-2 tw-flex tw-flex-wrap tw-gap-2 tw-text-xs tw-text-iron-200">
                <span
                  className={
                    issue.priority === ApiMonitoringSentryIssuePriorityEnum.High
                      ? "tw-text-error"
                      : undefined
                  }
                >
                  {t(locale, `monitoring.sentry.priority.${issue.priority}`)}
                </span>
                <span>
                  {t(locale, `monitoring.sentry.level.${issue.level}`)}
                </span>
                <span>
                  {t(locale, `monitoring.sentry.state.${issue.state}`)}
                </span>
              </p>
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(locale, "monitoring.sentry.openIssue", {
                  issue: issue.title,
                })}
                className="hover:tw-text-primary-200 tw-break-words tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-300"
              >
                {issue.title}
              </a>
              <p className="tw-mb-3 tw-mt-3 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(
                  locale,
                  issue.occurrences === 1
                    ? "monitoring.sentry.event"
                    : "monitoring.sentry.events",
                  {
                    count: formatInteger(locale, issue.occurrences),
                  }
                )}
              </p>
              <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-2 tw-text-xs sm:tw-grid-cols-2">
                {(
                  [
                    ["first_seen", "monitoring.sentry.firstSeen"],
                    ["last_seen", "monitoring.sentry.lastSeen"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <dt className="tw-text-iron-400">{t(locale, label)}</dt>
                    <dd className="tw-m-0 tw-mt-1">
                      <time dateTime={issue[field]}>
                        {formatDate(locale, issue[field], DATE_OPTIONS)}
                      </time>
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      )}
      {hasMore ? (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-400">
          {t(locale, "monitoring.sentry.more")}
        </p>
      ) : null}
    </section>
  );
}
