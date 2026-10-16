import { getAppMetadata } from "@/components/providers/metadata";
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
    description:
      "Every TDH boost schedule 6529.io has used, the current one first, with the values each paid.",
  });
};
