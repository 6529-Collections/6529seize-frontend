import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TDHConsolidationPage from "./page.client";

export default function TDHConsolidation() {
  return <TDHConsolidationPage />;
}

export const generateMetadata = () => {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdhConsolidation.pageTitle"),
      description: t(
        DEFAULT_LOCALE,
        "network.tdhConsolidation.metadataDescription"
      ),
    },
    { canonicalPath: "/network/tdh/consolidation" }
  );
};
