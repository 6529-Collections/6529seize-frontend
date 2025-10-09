import { getAppMetadata } from "@/components/providers/metadata";
import DefinitionsClient from "./page.client";

export default function Definitions() {
  return <DefinitionsClient />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Definitions",
    description: "Network",
  });
};
