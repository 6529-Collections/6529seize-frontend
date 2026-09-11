import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(
      DEFAULT_LOCALE,
      "museum.network.institutionalPractice.sourceRegisterTitle"
    ),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.institutionalPractice.sourceRegisterDescription"
    ),
  }),
  alternates: {
    canonical: "/museum/network/research/institutional-practice/sources",
  },
};

export { renderMuseumInstitutionalPracticeSourcesPage as default } from "@/app/museum/network/stories/a-field-of-practice/sources/page";
