import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import StandaloneTheMemesMintPageClient from "./StandaloneTheMemesMintPageClient";

export const dynamic = "force-static";
export const metadata = getAppMetadata({
  title: "Mint | The Memes by 6529",
  ogImage: `${publicEnv.BASE_ENDPOINT}/memes-preview.png`,
  description: "Collections",
  twitterCard: "summary_large_image",
});

export default function StandaloneTheMemesMintPage() {
  return <StandaloneTheMemesMintPageClient />;
}
