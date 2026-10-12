import type { ApiMonitoringSentryHistory } from "@/generated/models/ApiMonitoringSentryHistory";
import { ApiMonitoringSentryHistoryStatusEnum } from "@/generated/models/ApiMonitoringSentryHistory";
import { formatDate, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useState } from "react";

import SentryHistoryChart from "./sentry-history-chart";

const HISTORY_DATE_OPTIONS = {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
} satisfies Intl.DateTimeFormatOptions;

export default function SentryHistory({
  history,
  loading,
  unavailable,
  locale,
  onRetry,
}: {
  readonly history: ApiMonitoringSentryHistory | undefined;
  readonly loading: boolean;
  readonly unavailable: boolean;
  readonly locale: SupportedLocale;
  readonly onRetry: () => void;
}) {
  const [metric, setMetric] = useState<"events" | "issues">("events");
  const heading = t(locale, "monitoring.sentry.history.title");
  const incomplete = history?.projects.some((project) =>
    project.days.some((day) => day.events === null || day.issues === null)
  );
  let content;
  if (unavailable) {
    content = (
      <div className="tw-space-y-3">
        <p role="alert">{t(locale, "monitoring.sentry.history.unavailable")}</p>
        <PrimaryButton loading={false} disabled={false} onClicked={onRetry}>
          {t(locale, "monitoring.retry")}
        </PrimaryButton>
      </div>
    );
  } else if (loading || !history) {
    content = (
      <p role="status">{t(locale, "monitoring.sentry.history.loading")}</p>
    );
  } else if (
    history.status === ApiMonitoringSentryHistoryStatusEnum.NotConfigured
  ) {
    content = <p>{t(locale, "monitoring.sentry.notConfigured")}</p>;
  } else {
    content = (
      <>
        <div
          className="tw-flex tw-flex-wrap tw-gap-2"
          role="group"
          aria-label={t(locale, "monitoring.sentry.history.metric")}
        >
          {(["events", "issues"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={metric === choice}
              onClick={() => setMetric(choice)}
              className={`tw-min-h-10 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 ${metric === choice ? "tw-text-primary-200 tw-border-primary-400 tw-bg-primary-400/10" : "tw-border-iron-600 tw-bg-iron-900 tw-text-iron-200 hover:tw-bg-iron-800"}`}
            >
              {t(locale, `monitoring.sentry.history.${choice}`)}
            </button>
          ))}
        </div>
        <SentryHistoryChart history={history} metric={metric} locale={locale} />
        {incomplete ? (
          <p role="status" className="tw-text-sm">
            {t(locale, "monitoring.sentry.history.partial")}
          </p>
        ) : null}
        <details className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3">
          <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-300">
            {t(locale, "monitoring.sentry.history.counts")}
          </summary>
          <div className="tw-grid tw-grid-cols-1 tw-gap-5 tw-pt-4 md:tw-grid-cols-2">
            {history.projects.map((project) => (
              <table
                key={project.project}
                className="tw-w-full tw-table-fixed tw-break-words tw-text-xs"
              >
                <caption className="tw-break-all tw-pb-3 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100">
                  {project.project}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="tw-py-2 tw-text-left">
                      {t(locale, "monitoring.sentry.history.day")}
                    </th>
                    <th scope="col" className="tw-py-2 tw-text-right">
                      {t(locale, "monitoring.sentry.history.events")}
                    </th>
                    <th scope="col" className="tw-py-2 tw-text-right">
                      {t(locale, "monitoring.sentry.history.issues")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...project.days].reverse().map((day) => (
                    <tr
                      key={day.date}
                      className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800"
                    >
                      <th
                        scope="row"
                        className="tw-py-2 tw-text-left tw-font-normal"
                      >
                        {formatDate(locale, day.date, HISTORY_DATE_OPTIONS)}
                      </th>
                      <td className="tw-py-2 tw-text-right">
                        {day.events === null
                          ? t(locale, "monitoring.sentry.history.missing")
                          : formatNumber(locale, day.events)}
                      </td>
                      <td className="tw-py-2 tw-text-right">
                        {day.issues === null
                          ? t(locale, "monitoring.sentry.history.missing")
                          : formatNumber(locale, day.issues)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </details>
        <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
          {t(locale, "monitoring.sentry.history.cache")}
        </p>
      </>
    );
  }
  return (
    <section
      aria-label={heading}
      className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-p-4"
    >
      <div>
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {heading}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm">
          {t(locale, "monitoring.sentry.history.description")}
        </p>
      </div>
      {content}
    </section>
  );
}
