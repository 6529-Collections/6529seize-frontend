import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import TheMemesMint from "@/components/the-memes/TheMemesMint";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";

export default async function TheMemesMintPage() {
  const headers = await getAppCommonHeaders();
  const nft = await commonApiFetch<ApiMemesExtendedData>({
    endpoint: "memes_latest",
    headers,
  });
  return (
    <main className={styles["main"]}>
      <TheMemesMint nft={nft} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "Mint | The Memes",
      ogImage: getCollectionSocialCardImagePath("the-memes", {
        title: "Mint | The Memes",
        subtitle: "Latest The Memes mint on 6529.io",
      }),
      ogImageAlt: "The Memes mint social card",
      description: "Collections",
    })
  );
}
