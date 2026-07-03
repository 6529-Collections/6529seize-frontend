import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import JsonLdScript from "@/lib/structured-data/json-ld";
import {
  buildNftPageJsonLd,
  fetchNftForStructuredData,
} from "@/lib/structured-data/nft";
import styles from "@/styles/Home.module.css";
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

  const title = `6529 Gradient #${id}`;
  const nft = await loadGradientNft(id);
  const image = nft?.thumbnail ?? nft?.image ?? null;

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
