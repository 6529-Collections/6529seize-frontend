import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import StandaloneTheMemesMintPageClient from "./StandaloneTheMemesMintPageClient";

export const dynamic = "force-static";
export const metadata = getAppMetadata({
  title: "Mint | The Memes by 6529",
  ogImage: `${publicEnv.BASE_ENDPOINT}/6529io.png`,
  description: "The Memes by 6529 Mint Page",
});

export default function StandaloneTheMemesMintPage() {
  return <StandaloneTheMemesMintPageClient />;
}
