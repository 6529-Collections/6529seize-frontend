import Home from "@/components/home/Home";
import { fetchInitialActivityData } from "@/components/latest-activity/fetchInitialActivityData";
import { isMintingActive } from "@/components/meme-calendar/meme-calendar.helpers";
import { fetchInitialTokens } from "@/components/nextGen/collections/collectionParts/hooks/fetchInitialTokens";
import { getAppMetadata } from "@/components/providers/metadata";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import styles from "@/styles/Home.module.scss";
import { Metadata } from "next";

export default async function HomePage() {
  const headers = await getAppCommonHeaders();

  // First, fetch featured data and activity data in parallel
  const [featuredNft, featuredNextgen, initialActivityData] = await Promise.all(
    [
      commonApiFetch<NFTWithMemesExtendedData>({
        endpoint: `memes_latest`,
        headers,
      }),
      commonApiFetch<NextGenCollection>({
        endpoint: `nextgen/featured`,
        headers,
      }),
      fetchInitialActivityData(1, 12),
    ]
  );

  // Then fetch initial tokens for the featured NextGen collection
  const initialTokens = featuredNextgen?.id
    ? await fetchInitialTokens(featuredNextgen.id)
    : [];

  return (
    <main className={styles.main}>
      <Home
        featuredNft={featuredNft}
        isMemeMintingActive={isMintingActive()}
        featuredNextgen={featuredNextgen}
        initialActivityData={initialActivityData}
        initialTokens={initialTokens}
      />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    ogImage: `${process.env.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
