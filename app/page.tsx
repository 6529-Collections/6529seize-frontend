import styles from "@/styles/Home.module.scss";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { commonApiFetch } from "@/services/api/common-api";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import Home from "@/components/home/Home";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";

export default async function HomePage() {
  const headers = await getAppCommonHeaders();
  const featuredNft = await commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: `memes_latest`,
    headers,
  }).then(async (responseExtended) => responseExtended);

  const featuredNextgen = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/featured`,
    headers,
  });

  return (
    <main className={styles.main}>
      <Home featuredNft={featuredNft} featuredNextgen={featuredNextgen} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    ogImage: `${process.env.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
