import Link from "next/link";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import {
  FOLLOW_THE_REPO_WAVE_URL,
  TECH_PR_REPORTS,
  TECH_WEEKLY_PR_REPORT,
  getTechReportTotal,
} from "./reports";

export default function AboutTech() {
  const locale = DEFAULT_LOCALE;

  return (
    <div className="tw-flex tw-flex-col tw-gap-10 tw-text-iron-200">
      <section className="tw-pb-2">
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
          About / Tech
        </p>
        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
          Tech Updates
        </h1>
        <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_18rem]">
          <div className="tw-flex tw-max-w-4xl tw-flex-col tw-gap-4 tw-text-base tw-leading-7 tw-text-iron-300">
            <p>
              This is a current casual area for longer 6529 tech updates: repo
              work, bot notes, release context, and build reports that are too
              large for a single wave drop.
            </p>
            <p>
              Shorter live repo activity still belongs in{" "}
              <a
                href={FOLLOW_THE_REPO_WAVE_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
              >
                Follow The Repo
              </a>
              {"."} This page is the linkable longer-form shelf beside it.
            </p>
          </div>
          <div className="tw-border-l-0 tw-border-solid tw-border-iron-800 tw-pt-1 lg:tw-border-l lg:tw-pl-6">
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
              Current Use
            </p>
            <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              Long updates, repo analysis, bot context, and links back into the
              wave conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="tw-max-w-6xl" aria-labelledby="tech-reports-heading">
        <div className="tw-mb-5 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <div>
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
              Index
            </p>
            <h2
              id="tech-reports-heading"
              className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
            >
              Reports
            </h2>
          </div>
          <p>
            <Link
              href={`/about/tech/${TECH_WEEKLY_PR_REPORT.slug}`}
              className="hover:tw-text-primary-200 tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline"
            >
              Open latest report
            </Link>
          </p>
        </div>

        <article className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50">
          <ul className="tw-mb-0 tw-list-none tw-divide-y tw-divide-iron-800 tw-p-0">
            {TECH_PR_REPORTS.map((report) => (
              <li key={report.slug}>
                <div className="tw-grid tw-gap-0 md:tw-grid-cols-[minmax(0,1fr)_12rem]">
                  <div className="tw-p-5">
                    <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                      {report.dateLabel}
                    </p>
                    <h3 className="tw-mb-2 tw-text-xl tw-font-semibold tw-leading-snug tw-text-iron-50">
                      <Link
                        href={`/about/tech/${report.slug}`}
                        className="hover:tw-text-primary-200 tw-text-iron-50 tw-no-underline"
                      >
                        {report.title}
                      </Link>
                    </h3>
                    <p className="tw-mb-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
                      {report.description}
                    </p>
                  </div>
                  <div className="tw-border-t tw-border-solid tw-border-iron-800 tw-p-5 md:tw-border-l md:tw-border-t-0">
                    <p className="tw-mb-1 tw-text-3xl tw-font-semibold tw-leading-none tw-text-iron-50">
                      {formatInteger(locale, getTechReportTotal(report))}
                    </p>
                    <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                      {t(locale, "about.tech.index.prsCovered")}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
