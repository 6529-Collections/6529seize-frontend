import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function generateMetadata(): Metadata {
  return {
    ...getAppMetadata({
      title: t(DEFAULT_LOCALE, "artworkDocumentation.title"),
      description: t(DEFAULT_LOCALE, "artworkDocumentation.intro"),
    }),
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}

export default function ArtworkDocumentationLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-label={t(DEFAULT_LOCALE, "artworkDocumentation.title")}
      className="tw-mx-auto tw-w-full tw-max-w-7xl tw-px-5 tw-pb-20 tw-pt-8 tw-text-iron-100 sm:tw-px-10 sm:tw-pt-12"
      style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
    >
      {children}
    </section>
  );
}
