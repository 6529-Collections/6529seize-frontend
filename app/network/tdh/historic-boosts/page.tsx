import { getAppMetadata } from "@/components/providers/metadata";
import TDHHistoricBoostsPage from "./page.client";

export default function TDHHistory() {
  return <TDHHistoricBoostsPage />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH Historic Boosts",
    description: "Network",
  });
};
