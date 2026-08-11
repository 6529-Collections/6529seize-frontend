import Link from "next/link";

import { formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { STREAM_REVIEW_DEVELOPMENT_STATUS } from "@/lib/public-review/streamReviewDevelopmentStatus.server";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";

const BEFORE_LAUNCH_ITEMS = [
  "publicReview.development.beforeLaunch.audit",
  "publicReview.development.beforeLaunch.liveTesting",
  "publicReview.development.beforeLaunch.launchSetup",
] as const;

export function StreamReviewDevelopmentStatus() {
  const status = STREAM_REVIEW_DEVELOPMENT_STATUS;

  return (
    <div className="tw-mt-8 tw-w-full tw-max-w-[52rem]">
      <section
        aria-labelledby="stream-launch-readiness"
        className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.1] tw-bg-iron-950/70 tw-p-5 sm:tw-p-7"
      >
        <h2
          id="stream-launch-readiness"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.development.heading")}
        </h2>

        <p className="tw-mb-0 tw-mt-5 tw-text-pretty tw-text-lg tw-font-medium tw-leading-7 tw-text-iron-100">
          {t(DEFAULT_LOCALE, "publicReview.development.answer")}
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.development.summary")}
        </p>

        <h3
          id="stream-before-launch"
          className="tw-mb-0 tw-mt-6 tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          {t(DEFAULT_LOCALE, "publicReview.development.beforeLaunch")}
        </h3>
        <ul
          aria-labelledby="stream-before-launch"
          className="tw-mb-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-primary-300"
        >
          {BEFORE_LAUNCH_ITEMS.map((messageKey) => (
            <li key={messageKey}>{t(DEFAULT_LOCALE, messageKey)}</li>
          ))}
        </ul>

        <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.development.pagePurpose")}
        </p>

        <dl className="tw-mb-0 tw-mt-6 tw-grid tw-gap-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-5 sm:tw-grid-cols-2">
          <div>
            <dt className="tw-text-xs tw-font-medium tw-text-iron-400">
              {t(DEFAULT_LOCALE, "publicReview.development.lastChecked")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
              <time dateTime={status.checkedAt}>
                {formatDate(DEFAULT_LOCALE, status.checkedAt)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="tw-text-xs tw-font-medium tw-text-iron-400">
              {t(DEFAULT_LOCALE, "publicReview.development.openBlockers")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
              {formatInteger(
                DEFAULT_LOCALE,
                status.evidenceSummary.openReleaseBlockers
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export function StreamReviewReviewerPrompts({
  pages,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
}) {
  const status = STREAM_REVIEW_DEVELOPMENT_STATUS;

  return (
    <section
      aria-labelledby="stream-review-questions-heading"
      className="tw-mt-8 tw-w-full tw-max-w-[52rem]"
    >
      <h2
        id="stream-review-questions-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl"
      >
        {t(DEFAULT_LOCALE, "publicReview.development.reviewQuestionsHeading")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          "publicReview.development.reviewQuestionsDescription"
        )}
      </p>
      <div className="tw-mt-6 tw-divide-y tw-divide-white/[0.08] tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08]">
        {status.reviewerPrompts.map((prompt) => {
          const page = pages.find(
            (candidate) => candidate.id === prompt.pageId
          );
          if (!page) {
            return null;
          }
          return (
            <article
              key={prompt.id}
              className="tw-grid tw-gap-2 tw-py-5 sm:tw-grid-cols-[9rem_minmax(0,1fr)_auto] sm:tw-items-center sm:tw-gap-5"
            >
              <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
                {prompt.title}
              </h3>
              <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                {prompt.question}
              </p>
              <Link
                href={`${getStreamReviewPageHref({ page })}#${prompt.sectionId}`}
                aria-label={t(
                  DEFAULT_LOCALE,
                  "publicReview.development.readQuestionLabel",
                  { title: prompt.title }
                )}
                className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-justify-self-start tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-justify-self-end"
              >
                {t(DEFAULT_LOCALE, "publicReview.development.readQuestion")}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
