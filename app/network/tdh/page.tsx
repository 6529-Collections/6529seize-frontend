import { getAppMetadata } from "@/components/providers/metadata";
import TDHMainPage from "./page.client";

export default function TDH() {
  return <TDHMainPage />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "TDH",
    description: "Network",
  });
};
