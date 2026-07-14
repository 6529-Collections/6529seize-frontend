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
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-10 tw-px-4 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8">
      <section className="tw-pb-2">
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
          About / Tech
        </p>
        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
          Tech Updates
        </h1>
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-5 tw-text-base tw-leading-7 tw-text-iron-50">
          <p className="tw-mb-0">
            This is a current casual area for longer 6529 tech updates: repo
            work, bot notes, release context, and build reports that are too
            large for a single wave drop.
          </p>
          <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
            <li>
              Long updates, repo analysis, bot context, and links back into the
              wave conversation.
            </li>
            <li>
              Shorter live repo activity still belongs in{" "}
              <a
                href={FOLLOW_THE_REPO_WAVE_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
              >
                Follow The Repo
              </a>
              . This page is the linkable longer-form shelf beside it.
            </li>
          </ul>
        </div>
      </section>

      <section className="tw-w-full" aria-labelledby="tech-notes-heading">
        <h2
          id="tech-notes-heading"
          className="tw-mb-5 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          Active Technical Notes
        </h2>
        <Link
          href="/about/tech/wallet-authentication"
          className="tw-block tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-5 tw-text-current tw-no-underline tw-transition-colors hover:tw-border-primary-500 hover:tw-bg-iron-900/60 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 focus:tw-ring-offset-2 focus:tw-ring-offset-black"
          aria-label={t(
            locale,
            "about.tech.notes.walletAuthentication.ariaLabel"
          )}
        >
          <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
            Auth changes
          </p>
          <h3 className="tw-mb-2 tw-text-xl tw-font-semibold tw-leading-snug tw-text-iron-50">
            Wallet authentication upgrade
          </h3>
          <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-50">
            What is changing with the new secure session, why users may be asked
            to upgrade, and what to expect during rollout.
          </p>
        </Link>
      </section>

      <section className="tw-w-full" aria-labelledby="tech-reports-heading">
        <div className="tw-mb-5 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <div>
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
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
                    <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
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
                    <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-50">
                      {report.description}
                    </p>
                  </div>
                  <div className="tw-border-t tw-border-solid tw-border-iron-800 tw-p-5 md:tw-border-l md:tw-border-t-0">
                    <p className="tw-mb-1 tw-text-3xl tw-font-semibold tw-leading-none tw-text-iron-50">
                      {formatInteger(locale, getTechReportTotal(report))}
                    </p>
                    <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
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
