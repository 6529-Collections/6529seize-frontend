import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TDHHistoricBoostsPage from "./page.client";

export default function TDHHistory() {
  return <TDHHistoricBoostsPage />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH Historic Boosts | Network",
    description: t(
      DEFAULT_LOCALE,
      "pageMetadata.networkTdhHistoricBoosts.description"
    ),
  });
};
