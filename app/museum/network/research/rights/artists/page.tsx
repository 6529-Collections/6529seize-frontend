import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.rights.artistGuideTitle"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.rights.artistGuideDescription"
    ),
  }),
  alternates: {
    canonical: "/museum/network/research/rights/artists",
  },
};

export { renderMuseumRightsForArtistsPage as default } from "@/app/museum/network/rights/artists/page";
