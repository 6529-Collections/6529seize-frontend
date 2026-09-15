import WavesCreatePageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata(
  { title: "Create Wave" },
  { robots: { index: false, follow: true } }
);

export default function WavesCreatePage() {
  return <WavesCreatePageClient />;
}
