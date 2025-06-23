import styles from "@/styles/Home.module.scss";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { commonApiFetch } from "@/services/api/common-api";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import { headers } from "next/headers";
import Home from "@/components/home/Home";

export default async function HomePage() {
  const reqHeaders = await headers();

  const featuredNft = await commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: `memes_latest`,
    headers: Object.fromEntries(reqHeaders),
  }).then(async (responseExtended) => responseExtended);

  const featuredNextgen = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/featured`,
    headers: Object.fromEntries(reqHeaders),
  });

  return (
    <main className={styles.main}>
      <Home featuredNft={featuredNft} featuredNextgen={featuredNextgen} />
    </main>
  );
}

export const metadata: Metadata = getAppMetadata({
  ogImage: `${process.env.BASE_ENDPOINT}/6529io-banner.png`,
  twitterCard: "summary_large_image",
});
