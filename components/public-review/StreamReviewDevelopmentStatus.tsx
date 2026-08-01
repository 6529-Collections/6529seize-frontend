import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  STREAM_REVIEW_DEVELOPMENT_STATUS,
  type StreamDevelopmentItem,
} from "@/lib/public-review/streamReviewDevelopmentStatus.server";
import { getStreamReviewPageHref } from "@/lib/public-review/streamReviewDefinition";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";

function getRepositoryUrl(path?: string): string {
  const { repository, commit } = STREAM_REVIEW_DEVELOPMENT_STATUS.source;
  const root = `https://github.com/${repository}`;
  if (!path) {
    return `${root}/commit/${commit}`;
  }
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${root}/blob/${commit}/${encodedPath}`;
}

function DevelopmentList({
  heading,
  id,
  items,
}: {
  readonly heading: string;
  readonly id: string;
  readonly items: readonly StreamDevelopmentItem[];
}) {
  return (
    <section aria-labelledby={id}>
      <h3
        id={id}
        className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
      >
        {heading}
      </h3>
      <ul className="tw-mb-0 tw-mt-3 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-primary-300">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.text}</span>{" "}
            <a
              href={getRepositoryUrl(item.evidencePath)}
              target="_blank"
              rel="noreferrer"
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/45 tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              {t(DEFAULT_LOCALE, "publicReview.development.openEvidence")}
              <ArrowTopRightOnSquareIcon
                className="tw-size-3.5 tw-flex-none"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StreamReviewDevelopmentStatus({
  pages,
  reviewSourceCommit,
  reviewVersion,
}: {
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly reviewSourceCommit: string;
  readonly reviewVersion: string;
}) {
  const status = STREAM_REVIEW_DEVELOPMENT_STATUS;
  const { complete, pending, missing } = status.evidenceSummary.requirements;

  return (
    <div className="tw-mt-8 tw-w-full tw-max-w-[52rem]">
      <section
        aria-labelledby="development-update"
        className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.1] tw-bg-iron-950/70 tw-p-5 sm:tw-p-7"
      >
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-5 tw-gap-y-2">
          <h2
            id="development-update"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl"
          >
            {t(DEFAULT_LOCALE, "publicReview.development.heading")}
          </h2>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            <time dateTime={status.checkedAt}>
              {t(DEFAULT_LOCALE, "publicReview.development.checkedAt", {
                date: formatDate(DEFAULT_LOCALE, status.checkedAt),
              })}
            </time>
            {" · "}
            <a
              href={getRepositoryUrl()}
              target="_blank"
              rel="noreferrer"
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 tw-font-medium tw-text-iron-300 tw-underline tw-decoration-white/25 tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              {t(DEFAULT_LOCALE, "publicReview.development.source")}
              <ArrowTopRightOnSquareIcon
                className="tw-size-3.5 tw-flex-none"
                aria-hidden="true"
              />
            </a>
          </p>
        </div>

        <p className="tw-mb-0 tw-mt-5 tw-text-pretty tw-text-lg tw-font-medium tw-leading-7 tw-text-iron-100">
          {status.headline}
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {status.summary}
        </p>
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "publicReview.development.evidenceSummary", {
            complete: formatInteger(DEFAULT_LOCALE, complete),
            pending: formatInteger(DEFAULT_LOCALE, pending),
            missing: formatInteger(DEFAULT_LOCALE, missing),
            blockers: formatInteger(
              DEFAULT_LOCALE,
              status.evidenceSummary.openReleaseBlockers
            ),
          })}
        </p>

        <div className="tw-mt-6 tw-grid tw-gap-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-6 lg:tw-grid-cols-3">
          <DevelopmentList
            heading={t(
              DEFAULT_LOCALE,
              "publicReview.development.finishedRecently"
            )}
            id="stream-development-finished"
            items={status.recentlyCompleted}
          />
          <DevelopmentList
            heading={t(DEFAULT_LOCALE, "publicReview.development.workingOn")}
            id="stream-development-working"
            items={status.workingOn}
          />
          <DevelopmentList
            heading={t(DEFAULT_LOCALE, "publicReview.development.beforeLaunch")}
            id="stream-development-before-launch"
            items={status.beforeLaunch}
          />
        </div>

        <p className="tw-mb-0 tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-5 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "publicReview.development.snapshotNote", {
            version: reviewVersion,
            commit: reviewSourceCommit.slice(0, 8),
          })}
        </p>
      </section>

      <section
        aria-labelledby="stream-review-questions-heading"
        className="tw-mt-8"
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
                  className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-justify-self-start tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-justify-self-end"
                >
                  {t(DEFAULT_LOCALE, "publicReview.development.readQuestion")}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
