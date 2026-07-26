import Link from "next/link";
import type { ReactNode } from "react";

import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewDefinition } from "@/lib/public-review/publicReviewTypes";

export function PublicReviewReferenceShell({
  children,
  description,
  displayedVersion,
  editorialHref,
  referenceHref,
  review,
  title,
}: {
  readonly children: ReactNode;
  readonly description: string;
  readonly displayedVersion: string;
  readonly editorialHref: string;
  readonly referenceHref: string;
  readonly review: PublicReviewDefinition;
  readonly title: string;
}) {
  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-[#0b0b0d] tw-text-white">
      <PublicReviewStatusBanner
        review={review}
        displayedVersion={displayedVersion}
      />
      <div className="tw-mx-auto tw-w-full tw-max-w-[88rem] tw-px-4 tw-pb-20 tw-pt-8 sm:tw-px-6 lg:tw-px-8 lg:tw-pt-12">
        <nav
          aria-label={t(DEFAULT_LOCALE, "publicReview.navigation.label")}
          className="tw-flex tw-flex-wrap tw-gap-3 tw-text-sm"
        >
          <Link
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-font-semibold tw-text-iron-200 tw-no-underline hover:tw-border-iron-500 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
            href={editorialHref}
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.backToReview")}
          </Link>
          <Link
            aria-current="page"
            className="tw-text-primary-200 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/50 tw-bg-primary-400/10 tw-px-3 tw-py-2 tw-font-semibold tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
            href={referenceHref}
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.openReference")}
          </Link>
        </nav>

        <header className="tw-mt-8 tw-max-w-5xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-sky-300">
            {t(DEFAULT_LOCALE, "publicReview.reference.eyebrow")}
          </p>
          <h1 className="tw-mb-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-5xl">
            {title}
          </h1>
          <p className="tw-mb-0 tw-mt-5 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
            {description}
          </p>
          <span className="tw-mt-5 tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-sky-400/40 tw-bg-sky-400/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-sky-200">
            {t(DEFAULT_LOCALE, "publicReview.reference.generatedLabel")}
          </span>
        </header>

        <div className="tw-mt-8">{children}</div>
      </div>
    </div>
  );
}
