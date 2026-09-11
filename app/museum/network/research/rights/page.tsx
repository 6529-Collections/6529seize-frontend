import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.rights.title"),
    description: t(DEFAULT_LOCALE, "museum.network.rights.description"),
  }),
  alternates: { canonical: "/museum/network/research/rights" },
};

export { renderMuseumRightsPage as default } from "@/app/museum/network/rights/page";
