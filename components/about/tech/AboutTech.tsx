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
  const latestReportTotal = formatInteger(
    locale,
    getTechReportTotal(TECH_WEEKLY_PR_REPORT)
  );
  const reportCount = formatInteger(locale, TECH_PR_REPORTS.length);

  return (
    <div className="tw-flex tw-flex-col tw-gap-12 tw-text-iron-200">
      <section className="tw-border-b tw-border-solid tw-border-iron-800 tw-pb-10">
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
          About / Tech
        </p>
        <h1 className="tw-mb-5 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-5xl">
          Tech Updates
        </h1>
        <div className="tw-grid tw-gap-7 xl:tw-grid-cols-[minmax(0,1fr)_22rem]">
          <div className="tw-flex tw-max-w-4xl tw-flex-col tw-gap-4 tw-text-lg tw-leading-8 tw-text-iron-300">
            <p className="tw-mb-0">
              Long-form 6529 engineering context: release notes, repo analysis,
              bot findings, and implementation reports that need more room than
              a wave drop.
            </p>
            <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-400">
              Shorter live repo activity still belongs in{" "}
              <a
                href={FOLLOW_THE_REPO_WAVE_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
              >
                Follow The Repo
              </a>
              . This page is the linkable shelf for the longer pieces.
            </p>
          </div>
          <dl className="tw-mb-0 tw-grid tw-grid-cols-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/50">
            <div className="tw-border-r tw-border-solid tw-border-white/10 tw-p-4">
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                Latest
              </dt>
              <dd className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-none tw-text-iron-50">
                {latestReportTotal}
              </dd>
            </div>
            <div className="tw-border-r tw-border-solid tw-border-white/10 tw-p-4">
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                Reports
              </dt>
              <dd className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-leading-none tw-text-iron-50">
                {reportCount}
              </dd>
            </div>
            <div className="tw-p-4">
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                Format
              </dt>
              <dd className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
                Long reads
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="tw-max-w-6xl" aria-labelledby="tech-guidance-heading">
        <div className="tw-mb-5">
          <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
            Current Guidance
          </p>
          <h2
            id="tech-guidance-heading"
            className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
          >
            Active Technical Notes
          </h2>
        </div>
        <div className="tw-grid tw-gap-4 lg:tw-grid-cols-2">
          <Link
            href="/about/tech/wallet-authentication"
            className="tw-group tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-500/10 tw-p-5 tw-no-underline tw-transition hover:tw-border-primary-300/60 hover:tw-bg-primary-500/15 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
          >
            <p className="tw-text-primary-200 tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4">
              Wallet Authentication
            </p>
            <h3 className="group-hover:tw-text-primary-100 tw-mb-2 tw-text-xl tw-font-semibold tw-leading-snug tw-text-iron-50">
              What is changing with wallet auth
            </h3>
            <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              A simple explanation of the new secure session, why users may be
              asked to upgrade, and what to expect during rollout.
            </p>
          </Link>
          <a
            href={FOLLOW_THE_REPO_WAVE_URL}
            target="_blank"
            rel="noreferrer"
            className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/50 tw-p-5 tw-no-underline tw-transition hover:tw-border-white/20 hover:tw-bg-iron-900/60 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
          >
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
              Live Updates
            </p>
            <h3 className="tw-mb-2 tw-text-xl tw-font-semibold tw-leading-snug tw-text-iron-50">
              Follow The Repo
            </h3>
            <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              The wave for shorter repo activity, live comments, and links back
              into the daily engineering conversation.
            </p>
          </a>
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

        <article className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/50">
          <ul className="tw-mb-0 tw-list-none tw-divide-y tw-divide-iron-800 tw-p-0">
            {TECH_PR_REPORTS.map((report) => (
              <li key={report.slug}>
                <div className="tw-grid tw-gap-0 tw-transition hover:tw-bg-iron-900/35 md:tw-grid-cols-[minmax(0,1fr)_12rem]">
                  <div className="tw-p-5 md:tw-p-6">
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
                  <div className="tw-flex tw-items-center tw-border-t tw-border-solid tw-border-iron-800 tw-p-5 md:tw-border-l md:tw-border-t-0 md:tw-p-6">
                    <div>
                      <p className="tw-mb-1 tw-text-3xl tw-font-semibold tw-leading-none tw-text-iron-50">
                        {formatInteger(locale, getTechReportTotal(report))}
                      </p>
                      <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                        {t(locale, "about.tech.index.prsCovered")}
                      </p>
                    </div>
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
