import { getAppMetadata } from "@/components/providers/metadata";
import XTDHMainPage from "./page.client";

export default function XTDH() {
  return <XTDHMainPage />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "xTDH",
    description: "Network",
  });
};
