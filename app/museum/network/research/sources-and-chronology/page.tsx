import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.research.title"),
    description: t(DEFAULT_LOCALE, "museum.network.research.description"),
  }),
  alternates: {
    canonical: "/museum/network/research/sources-and-chronology",
  },
};

export { renderMuseumSourceAndChronologyPage as default } from "@/app/museum/network/stories/source-and-chronology/page";
