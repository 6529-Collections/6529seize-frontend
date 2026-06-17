import Link from "next/link";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import {
  FOLLOW_THE_REPO_WAVE_URL,
  TECH_WEEKLY_PR_REPORT,
  getTechReportTotal,
  type TechWeeklyPrReport,
} from "./reports";
import TechReportMarkdown from "./TechReportMarkdown";

const stripMarkdownTitle = (markdown: string): string =>
  markdown.replace(/^# .+\r?\n\r?\n?/, "");

export default function TechReportPage({
  report = TECH_WEEKLY_PR_REPORT,
}: Readonly<{ report?: TechWeeklyPrReport }>) {
  const locale = DEFAULT_LOCALE;
  const reportTotal = getTechReportTotal(report);
  const formattedReportTotal = formatInteger(locale, reportTotal);
  const formattedRepoCount = formatInteger(locale, report.repos.length);

  return (
    <article className="tw-flex tw-flex-col tw-gap-10 tw-text-iron-200">
      <header className="tw-pb-2">
        <Link
          href="/about/tech"
          className="hover:tw-text-primary-200 tw-mb-5 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline"
        >
          Back to Tech
        </Link>
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
          {report.dateLabel}
        </p>
        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
          {report.title}
        </h1>
        <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <p className="tw-mb-4 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300">
              {report.description} The source reports are preserved below and
              grouped by repository.
            </p>
            <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
              For live PR drops and shorter updates, see{" "}
              <a
                href={FOLLOW_THE_REPO_WAVE_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
              >
                Follow The Repo
              </a>
              {"."}
            </p>
          </div>
          <dl className="tw-mb-0 tw-grid tw-grid-cols-3 tw-gap-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 lg:tw-grid-cols-1">
            <div className="tw-border-r tw-border-solid tw-border-iron-800 tw-p-4 lg:tw-border-b lg:tw-border-r-0">
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                {t(locale, "about.tech.report.total")}
              </dt>
              <dd className="tw-mb-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-leading-none tw-text-iron-50">
                {formattedReportTotal}
              </dd>
            </div>
            <div className="tw-border-r tw-border-solid tw-border-iron-800 tw-p-4 lg:tw-border-b lg:tw-border-r-0">
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                {t(locale, "about.tech.report.repos")}
              </dt>
              <dd className="tw-mb-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-leading-none tw-text-iron-50">
                {formattedRepoCount}
              </dd>
            </div>
            <div className="tw-p-4">
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                {t(locale, "about.tech.report.daily")}
              </dt>
              <dd className="tw-mb-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-leading-none tw-text-iron-50">
                14:00
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section
        aria-labelledby="report-toc-heading"
        className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50"
      >
        <div className="tw-border-b tw-border-solid tw-border-iron-800 tw-p-5">
          <h2
            id="report-toc-heading"
            className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            In This Report
          </h2>
          <p className="tw-mb-0 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "about.tech.report.tocDescription")}
          </p>
        </div>
        <nav aria-label="Report repositories">
          <ol className="tw-mb-0 tw-list-none tw-divide-y tw-divide-iron-800 tw-p-0">
            {report.repos.map((repo, index) => (
              <li key={repo.key}>
                <a
                  href={`#${repo.key}`}
                  className="hover:tw-text-primary-200 tw-grid tw-gap-2 tw-p-4 tw-text-iron-100 tw-no-underline hover:tw-bg-iron-900/35 md:tw-grid-cols-[3rem_13rem_minmax(0,1fr)_10rem]"
                >
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="tw-font-semibold">{repo.name}</span>
                  <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
                    {repo.focus}
                  </span>
                  <span className="tw-text-sm tw-text-iron-400 md:tw-text-right">
                    {t(locale, "about.tech.report.prCount", {
                      count: formatInteger(locale, repo.prCount),
                    })}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      {report.repos.map((repo) => (
        <section
          key={repo.key}
          id={repo.key}
          className="tw-scroll-mt-24 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/35"
        >
          <header className="tw-border-b tw-border-solid tw-border-iron-800 tw-p-5 md:tw-p-6">
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
              {repo.repoFullName}
            </p>
            <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-end lg:tw-justify-between">
              <div>
                <h2 className="tw-mb-2 tw-text-2xl tw-font-semibold tw-leading-snug tw-text-iron-50">
                  {repo.name}
                </h2>
                <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {t(locale, "about.tech.report.repoSummary", {
                    focus: repo.focus,
                    count: formatInteger(locale, repo.prCount),
                    stateSummary: repo.stateSummary,
                  })}
                </p>
              </div>
              <a
                href={repo.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:tw-text-primary-200 tw-text-sm tw-font-semibold tw-text-primary-300"
              >
                View repository
              </a>
            </div>
          </header>

          <div className="tw-p-5 md:tw-p-6">
            <TechReportMarkdown markdown={stripMarkdownTitle(repo.content)} />
          </div>
        </section>
      ))}
    </article>
  );
}
