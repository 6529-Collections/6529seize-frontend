import { getAppMetadata } from "@/components/providers/metadata";
import XTDHMainPage from "./page.client";

export default function XTDH() {
  return <XTDHMainPage />;
}

export const generateMetadata = () => {
  return getAppMetadata(
    {
      title: "xTDH Overview | Network",
      description: "Explore xTDH allocations and network context.",
    },
    { canonicalPath: "/network/xtdh" }
  );
};
