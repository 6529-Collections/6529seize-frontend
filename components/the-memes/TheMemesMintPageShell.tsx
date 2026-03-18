import styles from "@/styles/Home.module.scss";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import TheMemesMint from "./TheMemesMint";
import type { Metadata } from "next";

export async function fetchLatestTheMemesMintNft(
  headers?: Readonly<Record<string, string>>
): Promise<NFTWithMemesExtendedData> {
  const response = await fetch(
    new URL("/api/memes_latest", publicEnv.API_ENDPOINT).toString(),
    headers ? { headers } : undefined
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Failed to load latest meme for mint export (${response.status}): ${
        body || response.statusText
      }`
    );
  }

  return (await response.json()) as NFTWithMemesExtendedData;
}

export function TheMemesMintPageShell({
  nft,
  standalone = false,
}: {
  readonly nft: NFTWithMemesExtendedData;
  readonly standalone?: boolean;
}) {
  return (
    <main className={styles["main"]}>
      <TheMemesMint nft={nft} standalone={standalone} />
    </main>
  );
}

export function getTheMemesMintMetadata({
  standalone = false,
}: {
  readonly standalone?: boolean;
} = {}): Metadata {
  return getAppMetadata({
    title: standalone ? "Mint | The Memes by 6529" : "Mint | The Memes",
    ogImage: `${publicEnv.BASE_ENDPOINT}/memes-preview.png`,
    description: "Collections",
    twitterCard: "summary_large_image",
  });
}
