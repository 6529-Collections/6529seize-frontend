import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.dataArchitecture.title"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.dataArchitecture.description"
    ),
  }),
  alternates: {
    canonical: "/museum/network/research/data-architecture",
  },
};

export { renderMuseumDataArchitecturePage as default } from "@/app/museum/network/methodology/data-architecture/page";
