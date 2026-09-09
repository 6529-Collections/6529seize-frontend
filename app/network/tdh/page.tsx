import { getAppMetadata } from "@/components/providers/metadata";
import TDHMainPage from "./page.client";

export default function TDH() {
  return <TDHMainPage />;
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "How TDH is calculated | Network",
    description:
      "Understand Total Days Held: holding days, edition weights, current boosts and an exact breakdown of your profile’s TDH.",
  });
};
