import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import JsonLdScript from "@/lib/structured-data/json-ld";
import {
  buildNftPageJsonLd,
  fetchNftForStructuredData,
} from "@/lib/structured-data/nft";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";
import { cache } from "react";

const loadGradientNft = cache((id: string) =>
  fetchNftForStructuredData({
    contract: GRADIENT_CONTRACT,
    id,
  })
);

export default async function GradientPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nft = await loadGradientNft(id);

  return (
    <main className={styles["main"]}>
      <JsonLdScript
        data={buildNftPageJsonLd({
          nft,
          path: `/6529-gradient/${id}`,
          fallbackName: `6529 Gradient #${id}`,
          collectionName: "6529 Gradient",
          collectionPath: "/6529-gradient",
          license: null,
        })}
      />
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
  let ogImage = `${publicEnv.BASE_ENDPOINT}/6529io.png`;
  const nft = await loadGradientNft(id);
  if (nft?.thumbnail) {
    ogImage = nft.thumbnail;
  } else if (nft?.image) {
    ogImage = nft.image;
  }

  return getAppMetadata({
    title,
    description: "Collections | 6529.io",
    ogImage,
    twitterCard: "summary",
  });
}
