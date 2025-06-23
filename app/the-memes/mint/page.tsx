import styles from "@/styles/Home.module.scss";

import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { commonApiFetch } from "@/services/api/common-api";
import { headers } from "next/headers";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import TheMemesMint from "@/components/the-memes/TheMemesMint";

export default async function TheMemesMintPage() {
  const reqHeaders = await headers();
  const nft = await commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: `memes_latest`,
    headers: Object.fromEntries(reqHeaders),
  }).then(async (responseExtended) => responseExtended);

  return (
    <main className={styles.main}>
      <TheMemesMint nft={nft} />
    </main>
  );
}

export const metadata: Metadata = getAppMetadata({
  title: "Mint | The Memes",
  ogImage: `${process.env.BASE_ENDPOINT}/memes-preview.png`,
  twitterCard: "summary_large_image",
});
