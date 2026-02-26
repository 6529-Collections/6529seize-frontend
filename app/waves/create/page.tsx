import { getAppMetadata } from "@/components/providers/metadata";

import WavesCreatePageClient from "./page.client";

export const metadata = getAppMetadata({ title: "Create Wave" });

export default function WavesCreatePage() {
  return <WavesCreatePageClient />;
}
