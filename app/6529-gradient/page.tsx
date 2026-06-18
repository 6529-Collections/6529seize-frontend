import GradientsComponent from "@/components/6529Gradient/6529Gradient";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildCollectionPageJsonLd } from "@/lib/structured-data/nft";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function GradientsPage() {
  return (
    <main className={styles["main"]}>
      <JsonLdScript
        data={buildCollectionPageJsonLd({
          path: "/6529-gradient",
          name: "6529 Gradient",
          description: "6529 Gradient is a 101-piece grayscale NFT collection.",
          image: `${publicEnv.BASE_ENDPOINT}/gradients-preview.png`,
        })}
      />
      <GradientsComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "6529 Gradient",
      description: "Collections",
      ogImage: getCollectionSocialCardImagePath("6529-gradient"),
      ogImageAlt: "6529 Gradient collection social card",
    })
  );
}
