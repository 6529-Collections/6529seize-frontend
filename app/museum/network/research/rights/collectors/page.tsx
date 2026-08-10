import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.rights.collectorGuideTitle"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.rights.collectorGuideDescription"
    ),
  }),
  alternates: {
    canonical: "/museum/network/research/rights/collectors",
  },
};

export { renderMuseumRightsForCollectorsPage as default } from "@/app/museum/network/rights/collectors/page";
