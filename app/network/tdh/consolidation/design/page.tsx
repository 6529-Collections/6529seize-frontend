import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TDHConsolidationDesignPage from "./page.client";

export default function TDHConsolidationDesign() {
  return <TDHConsolidationDesignPage />;
}

export const generateMetadata = () => {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdhConsolidation.design.pageTitle"),
      description: t(
        DEFAULT_LOCALE,
        "network.tdhConsolidation.design.metadataDescription"
      ),
    },
    { canonicalPath: "/network/tdh/consolidation/design" }
  );
};
