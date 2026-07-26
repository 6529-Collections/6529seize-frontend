import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewVersionDefinition } from "@/lib/public-review/publicReviewTypes";

const STATUS_CHIP =
  "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold";

export function PublicReviewStatusBanner({
  reviewVersion,
  displayedVersion,
}: {
  readonly reviewVersion: PublicReviewVersionDefinition;
  readonly displayedVersion: string;
}) {
  const shortCommit = reviewVersion.source.commit.slice(0, 10);
  const sourceUrl = `https://github.com/${reviewVersion.source.repository}/tree/${reviewVersion.source.commit}`;

  return (
    <section
      aria-labelledby="review-status-heading"
      className="tw-border-y tw-border-solid tw-border-iron-700 tw-bg-iron-900/95 tw-px-4 tw-py-4"
    >
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[88rem] tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div>
          <p
            id="review-status-heading"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white"
          >
            {t(DEFAULT_LOCALE, "publicReview.status.heading")}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-max-w-3xl tw-text-sm tw-leading-5 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "publicReview.status.explanation")}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span
            className={`${STATUS_CHIP} tw-border-amber-400/60 tw-bg-amber-400/10 tw-text-white`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.publicReview")}
          </span>
          <span
            className={`${STATUS_CHIP} tw-border-sky-400/60 tw-bg-sky-400/10 tw-text-white`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.notDeployed")}
          </span>
          <span
            className={`${STATUS_CHIP} tw-border-orange-400/60 tw-bg-orange-400/10 tw-text-white`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.preAudit")}
          </span>
          <span
            className={`${STATUS_CHIP} tw-border-iron-600 tw-text-iron-200`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.version", {
              version: displayedVersion,
            })}
          </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={`${STATUS_CHIP} tw-border-iron-600 tw-text-iron-100 tw-no-underline hover:tw-border-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.source", {
              commit: shortCommit,
            })}
            <span className="tw-sr-only">
              {" — "}
              {t(DEFAULT_LOCALE, "publicReview.status.sourceDetail", {
                commit: reviewVersion.source.commit,
              })}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
