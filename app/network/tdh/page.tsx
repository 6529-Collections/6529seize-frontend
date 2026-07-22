import { getAppMetadata } from "@/components/providers/metadata";
import TDHMainPage from "./page.client";

export default function TDH() {
  return <TDHMainPage />;
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "TDH | Network",
    description: "Network",
  });
};
