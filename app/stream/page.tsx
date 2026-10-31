import type { Metadata } from "next";

import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const STREAM_WORKS_REPOSITORY_URL =
  "https://github.com/6529-Collections/6529-works";

const STREAM_LINK_CLASS =
  "tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 tw-transition-colors hover:tw-text-primary-400 hover:tw-decoration-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F] motion-reduce:tw-transition-none";

export default function StreamPage() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-[#0D0D0F] tw-px-4 tw-pb-12 tw-pt-10 tw-text-iron-100 sm:tw-px-6 sm:tw-pt-12 lg:tw-px-8">
      <div className="tw-mx-auto tw-max-w-3xl">
        <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
          {t(DEFAULT_LOCALE, "stream.placeholder.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-200">
          {t(DEFAULT_LOCALE, "stream.placeholder.body")}
        </p>
        <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7">
          <a href={STREAM_WORKS_REPOSITORY_URL} className={STREAM_LINK_CLASS}>
            {t(DEFAULT_LOCALE, "stream.placeholder.repositoryLink")}
          </a>
        </p>
      </div>
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "stream.placeholder.title"),
      description: t(DEFAULT_LOCALE, "stream.placeholder.metadataDescription"),
    },
    { robots: { index: false, follow: true } }
  );
}
