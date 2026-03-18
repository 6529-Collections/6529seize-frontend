import {
  fetchLatestTheMemesMintNft,
  getTheMemesMintMetadata,
  TheMemesMintPageShell,
} from "@/components/the-memes/TheMemesMintPageShell";

export const dynamic = "force-static";
export const metadata = getTheMemesMintMetadata({ standalone: true });

export default async function StandaloneTheMemesMintPage() {
  const nft = await fetchLatestTheMemesMintNft();
  return <TheMemesMintPageShell nft={nft} standalone />;
}
