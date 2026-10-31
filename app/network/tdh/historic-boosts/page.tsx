import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadTdhRules } from "../loadTdhRules.server";
import TDHHistoricBoostsPage from "./page.client";

// The current schedule's ladder reads the boost rules.
export const revalidate = 600;

export default async function TDHHistory() {
  const rules = await loadTdhRules();
  return <TDHHistoricBoostsPage rules={rules} />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH historic boosts | Network",
    description: t(
      DEFAULT_LOCALE,
      "pageMetadata.networkTdhHistoricBoosts.description"
    ),
  });
};
