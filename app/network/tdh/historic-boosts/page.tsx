import { getAppMetadata } from "@/components/providers/metadata";
import TDHHistoricBoostsPage from "./page.client";

export default function TDHHistory() {
  return <TDHHistoricBoostsPage />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH historic boosts | Network",
    description: "Earlier TDH boost schedules, archived for reference.",
  });
};
