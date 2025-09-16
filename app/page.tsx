import { env } from "@/utils/env";
import styles from "@/styles/Home.module.scss";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { commonApiFetch } from "@/services/api/common-api";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import Home from "@/components/home/Home";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { fetchInitialActivityData } from "@/components/latest-activity/fetchInitialActivityData";
import { fetchInitialTokens } from "@/components/nextGen/collections/collectionParts/hooks/fetchInitialTokens";

export default async function HomePage() {
  const headers = await getAppCommonHeaders();
  
  // First, fetch featured data and activity data in parallel
  const [featuredNft, featuredNextgen, initialActivityData] = await Promise.all([
    commonApiFetch<NFTWithMemesExtendedData>({
      endpoint: `memes_latest`,
      headers,
    }),
    commonApiFetch<NextGenCollection>({
      endpoint: `nextgen/featured`,
      headers,
    }),
    fetchInitialActivityData(1, 12),
  ]);

  // Then fetch initial tokens for the featured NextGen collection
  const initialTokens = featuredNextgen?.id ? await fetchInitialTokens(featuredNextgen.id) : [];



  return (
    <main className={styles.main}>
      <Home 
        featuredNft={featuredNft} 
        featuredNextgen={featuredNextgen}
        initialActivityData={initialActivityData}
        initialTokens={initialTokens}
      />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    ogImage: `${env.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
