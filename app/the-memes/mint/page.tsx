import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import TheMemesMint from "@/components/the-memes/TheMemesMint";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";
import { cache } from "react";

const getLatestMeme = cache(async (): Promise<ApiMemesExtendedData> => {
  const headers = await getAppCommonHeaders();
  return commonApiFetch<ApiMemesExtendedData>({
    endpoint: "memes_latest",
    headers,
  });
});

export const getMintTitle = (nft: ApiMemesExtendedData | null): string => {
  const name = (nft as { readonly name?: string } | null)?.name?.trim();
  return nft && name
    ? `Mint #${nft.id} | ${name} | The Memes`
    : "Mint | The Memes";
};

export default async function TheMemesMintPage() {
  const nft = await getLatestMeme();
  return (
    <main className={styles["main"]}>
      <TheMemesMint nft={nft} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const nft = await getLatestMeme().catch(() => null);
  const title = getMintTitle(nft);
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      ogImage: getCollectionSocialCardImagePath("the-memes", {
        title,
        subtitle: "Latest The Memes mint on 6529.io",
      }),
      ogImageAlt: "The Memes mint social card",
      description: t(DEFAULT_LOCALE, "theMemes.mint.metadata.description"),
    }),
    { canonicalPath: "/the-memes/mint" }
  );
}
