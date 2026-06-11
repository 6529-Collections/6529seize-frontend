import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default async function GradientPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className={styles["main"]}>
      <GradientPageComponent id={id} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let title = `6529 Gradient #${id}`;
  let image: string | null = null;
  try {
    const response = await fetchUrl(
      `${publicEnv.API_ENDPOINT}/api/nfts?contract=${GRADIENT_CONTRACT}&id=${id}`
    );
    if (response?.data?.length > 0) {
      const nft = response.data[0];
      if (nft.thumbnail) {
        image = nft.thumbnail;
      } else if (nft.image) {
        image = nft.image;
      }
    }
  } catch (error) {
    console.error(`Failed to load gradient metadata for id ${id}`, error);
  }
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title,
      description: "Collections",
      ogImage: getNftSocialCardImagePath({
        badge: "6529 Gradient",
        collection: "6529 Gradient",
        contract: GRADIENT_CONTRACT,
        id,
        image,
        subtitle: "Collections",
        title,
      }),
      ogImageAlt: `${title} social card`,
    })
  );
}
