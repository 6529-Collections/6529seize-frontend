import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewAudience } from "@/lib/public-review/publicReviewTypes";

const AUDIENCE_COPY: Record<
  PublicReviewAudience,
  { readonly title: MessageKey; readonly description: MessageKey }
> = {
  community: {
    title: "publicReview.audiences.community.title",
    description: "publicReview.audiences.community.description",
  },
  artists: {
    title: "publicReview.audiences.artists.title",
    description: "publicReview.audiences.artists.description",
  },
  technical: {
    title: "publicReview.audiences.technical.title",
    description: "publicReview.audiences.technical.description",
  },
  auditors: {
    title: "publicReview.audiences.auditors.title",
    description: "publicReview.audiences.auditors.description",
  },
};

export function PublicReviewAudiencePaths() {
  return (
    <section
      aria-labelledby="review-audiences-heading"
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/60 tw-p-5 sm:tw-p-6"
    >
      <h2
        id="review-audiences-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.audiences.heading")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.audiences.description")}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {Object.entries(AUDIENCE_COPY).map(([audience, copy]) => (
          <article
            key={audience}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-black/30 tw-p-4"
          >
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
              {t(DEFAULT_LOCALE, copy.title)}
            </h3>
            <p className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(DEFAULT_LOCALE, copy.description)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
