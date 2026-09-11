import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(
      DEFAULT_LOCALE,
      "museum.network.institutionalPractice.editorialTitle"
    ),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.institutionalPractice.editorialDescription"
    ),
  }),
  alternates: {
    canonical: "/museum/network/research/scholarship-and-writing",
  },
};

export { renderMuseumScholarshipAndWritingPage as default } from "@/app/museum/network/stories/scholarship-and-writing/page";
