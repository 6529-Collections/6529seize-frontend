import { SparklesIcon } from "@heroicons/react/24/outline";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function StreamReviewBotAuthorshipNote() {
  const label = t(DEFAULT_LOCALE, "publicReview.authorship.label");

  return (
    <aside
      aria-labelledby="stream-review-authorship-label"
      className="tw-relative tw-mt-8 tw-w-full tw-max-w-[52rem] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-primary-400/25 tw-bg-[#17131C] tw-p-4 tw-shadow-[0_18px_55px_-32px_rgba(217,70,239,0.7)] sm:tw-p-5"
    >
      <div
        aria-hidden="true"
        className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-bg-primary-400"
      />
      <div className="tw-flex tw-items-start tw-gap-4">
        <span className="tw-text-primary-200 tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-primary-300/25 tw-bg-primary-400/10">
          <SparklesIcon className="tw-size-5" aria-hidden="true" />
        </span>
        <div className="tw-min-w-0">
          <p
            id="stream-review-authorship-label"
            className="tw-text-primary-200 tw-m-0 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em]"
          >
            {label}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-200 sm:tw-text-[0.95rem]">
            {t(DEFAULT_LOCALE, "publicReview.authorship.body")}
          </p>
        </div>
      </div>
    </aside>
  );
}
