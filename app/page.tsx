import HomePage from "@/components/home/HomePage";
import { fetchInitialActivityData } from "@/components/latest-activity/fetchInitialActivityData";
import { isMintingActive } from "@/components/meme-calendar/meme-calendar.helpers";
import { fetchInitialTokens } from "@/components/nextGen/collections/collectionParts/hooks/fetchInitialTokens";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default async function Page() {
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
    <main className={styles["main"]}>
      <HomePage
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
    ogImage: `${publicEnv.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
