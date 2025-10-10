import WavesCreatePageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata({ title: "Create Wave" });

export default function WavesCreatePage() {
  return <WavesCreatePageClient />;
}
