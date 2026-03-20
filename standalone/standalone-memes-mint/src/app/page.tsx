import {
  fetchLatestTheMemesMintNft,
  getTheMemesMintMetadata,
  TheMemesMintPageShell,
} from "@/components/the-memes/TheMemesMintPageShell";

export const dynamic = "force-static";
export const metadata = getTheMemesMintMetadata({ standalone: true });

export default async function StandaloneTheMemesMintPage() {
  try {
    const nft = await fetchLatestTheMemesMintNft();
    return <TheMemesMintPageShell nft={nft} standalone />;
  } catch (error) {
    throw new Error(
      `Failed to fetch latest TheMemesMint NFT: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
