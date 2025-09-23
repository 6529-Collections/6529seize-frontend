import { env } from "@/config/env";
import styles from "@/styles/Home.module.scss";

import { getAppMetadata } from "@/components/providers/metadata";
import TheMemesMint from "@/components/the-memes/TheMemesMint";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { Metadata } from "next";

export default async function TheMemesMintPage() {
  const headers = await getAppCommonHeaders();
  const nft = await commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: `memes_latest`,
    headers,
  }).then(async (responseExtended) => responseExtended);

  return (
    <main className={styles.main}>
      <TheMemesMint nft={nft} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Mint | The Memes",
    ogImage: `${env.BASE_ENDPOINT}/memes-preview.png`,
    description: "Collections",
    twitterCard: "summary_large_image",
  });
}
