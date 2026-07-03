import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "join.metadata.title"),
  description: t(DEFAULT_LOCALE, "join.metadata.description"),
});

export default function JoinPage() {
  return (
    <main className="tailwind-scope tw-min-h-dvh tw-bg-black tw-px-4 tw-py-12 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8">
      <section className="tw-mx-auto tw-flex tw-max-w-3xl tw-flex-col tw-gap-4">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-400">
          {t(DEFAULT_LOCALE, "join.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-text-4xl tw-font-semibold tw-tracking-normal tw-text-white sm:tw-text-5xl">
          {t(DEFAULT_LOCALE, "join.heading")}
        </h1>
        {/* TODO: Replace this placeholder with the approved Join 6529 page in a separate acquisition/onboarding task. */}
        <p className="tw-m-0 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "join.placeholder")}
        </p>
      </section>
    </main>
  );
}
