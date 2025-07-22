import { getAppMetadata } from "@/components/providers/metadata";
import LevelsClient from "./page.client";

export default function Levels() {
  return <LevelsClient />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Levels",
    description: "Network",
  });
};
