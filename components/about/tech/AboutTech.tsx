import Link from "next/link";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "../AboutLayout";

import {
  FOLLOW_THE_REPO_WAVE_URL,
  TECH_PR_REPORTS,
  TECH_WEEKLY_PR_REPORT,
  getTechReportTotal,
} from "./reports";

export default function AboutTech() {
  const locale = DEFAULT_LOCALE;

  return (
    <article
      className={`tw-w-full tw-overflow-hidden tw-bg-[#0D0D0F] tw-pb-[55px] tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-pb-[34px] tw-pt-[21px] sm:tw-px-0 sm:tw-pb-[55px] sm:tw-pt-[34px] lg:tw-px-2">
        <p className="tw-m-0 tw-mb-[13px] tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-primary-300">
          {t(locale, "about.tech.index.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-max-w-3xl tw-text-balance tw-text-3xl tw-font-semibold tw-leading-[1.03] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-text-4xl">
          {t(locale, "about.tech.index.title")}
        </h1>
        <div className="tw-mt-[21px] tw-max-w-4xl">
          <p className="tw-m-0 tw-text-pretty tw-text-lg tw-leading-7 tw-text-iron-100">
            {t(locale, "about.tech.index.intro")}
          </p>
          <ul className="tw-m-0 tw-mt-[21px] tw-grid tw-gap-[13px] tw-pl-[21px] tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600">
            <li>{t(locale, "about.tech.index.longUpdates")}</li>
            <li>
              {tRich(locale, "about.tech.index.liveActivity", {
                followTheRepo: (
                  <a
                    className="hover:tw-text-primary-200 tw-rounded-sm tw-font-semibold tw-text-primary-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F]"
                    href={FOLLOW_THE_REPO_WAVE_URL}
                    key="follow-the-repo"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t(locale, "about.tech.index.followTheRepo")}
                  </a>
                ),
              })}
            </li>
          </ul>
        </div>
      </header>

      <section
        aria-labelledby="tech-notes-heading"
        className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-py-[34px] sm:tw-px-0 sm:tw-py-[55px] lg:tw-px-2"
      >
        <h2
          id="tech-notes-heading"
          className="tw-m-0 tw-mb-[21px] tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
        >
          {t(locale, "about.tech.index.activeTechnicalNotes")}
        </h2>
        <Link
          href="/about/tech/wallet-authentication"
          className="tw-group tw-block tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-[21px] tw-text-current tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-primary-400/60 hover:tw-bg-iron-900/75 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F] motion-reduce:tw-transition-none"
          aria-label={t(
            locale,
            "about.tech.notes.walletAuthentication.ariaLabel"
          )}
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-500">
            {t(locale, "about.tech.index.authChanges")}
          </p>
          <h3 className="tw-m-0 tw-mt-[13px] tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 tw-transition-colors group-hover:tw-text-primary-300 group-focus-visible:tw-text-primary-300 motion-reduce:tw-transition-none">
            {t(locale, "about.tech.index.walletAuthenticationTitle")}
          </h3>
          <p className="tw-m-0 tw-mt-[13px] tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "about.tech.index.walletAuthenticationDescription")}
          </p>
        </Link>
      </section>

      <section
        aria-labelledby="tech-reports-heading"
        className="tw-px-1 tw-py-[34px] sm:tw-px-0 sm:tw-py-[55px] lg:tw-px-2"
      >
        <div className="tw-mb-[21px] tw-flex tw-flex-col tw-gap-[13px] sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <div>
            <p className="tw-m-0 tw-mb-[13px] tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-500">
              {t(locale, "about.tech.index.reportsEyebrow")}
            </p>
            <h2
              id="tech-reports-heading"
              className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
            >
              {t(locale, "about.tech.index.reportsTitle")}
            </h2>
          </div>
          <Link
            href={`/about/tech/${TECH_WEEKLY_PR_REPORT.slug}`}
            className="hover:tw-text-primary-200 tw-w-fit tw-rounded-sm tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F]"
          >
            {t(locale, "about.tech.index.openLatestReport")}
          </Link>
        </div>

        <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-white/10">
          <ul className="tw-m-0 tw-list-none tw-p-0">
            {TECH_PR_REPORTS.map((report) => (
              <li
                className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 last:tw-border-b-0"
                key={report.slug}
              >
                <article className="tw-grid tw-gap-0 md:tw-grid-cols-[minmax(0,1fr)_12rem]">
                  <div className="tw-p-[21px]">
                    <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-500">
                      {report.dateLabel}
                    </p>
                    <h3 className="tw-m-0 tw-mt-[13px] tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 sm:tw-text-lg">
                      <Link
                        href={`/about/tech/${report.slug}`}
                        className="hover:tw-text-primary-200 tw-rounded-sm tw-text-iron-50 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
                      >
                        {report.title}
                      </Link>
                    </h3>
                    <p className="tw-m-0 tw-mt-[13px] tw-text-sm tw-leading-6 tw-text-iron-400">
                      {report.description}
                    </p>
                  </div>
                  <div className="tw-flex tw-flex-col tw-justify-center tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-900/30 tw-p-[21px] md:tw-border-l md:tw-border-t-0">
                    <p className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-none tw-text-iron-50 tw-tabular-nums">
                      {formatInteger(locale, getTechReportTotal(report))}
                    </p>
                    <p className="tw-m-0 tw-mt-[13px] tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-500">
                      {t(locale, "about.tech.index.prsCovered")}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
