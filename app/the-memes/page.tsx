import styles from "@/styles/Home.module.scss";

import { getAppMetadata } from "@/components/providers/metadata";
import TheMemesComponent from "@/components/the-memes/TheMemes";
import { publicEnv } from "@/config/env";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildCollectionPageJsonLd } from "@/lib/structured-data/nft";
import { CC0_LICENSE_URL } from "@/lib/structured-data/utils";
import type { Metadata } from "next";
import { Suspense } from "react";

export default function TheMemesPage() {
  return (
    <main className={styles["main"]}>
      <JsonLdScript
        data={buildCollectionPageJsonLd({
          path: "/the-memes",
          name: "The Memes by 6529",
          description:
            "The Memes is the 6529 NFT collection of digital art cards.",
          image: `${publicEnv.BASE_ENDPOINT}/memes-preview.png`,
          license: CC0_LICENSE_URL,
        })}
      />
      <Suspense fallback={null}>
        <TheMemesComponent />
      </Suspense>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "The Memes",
    ogImage: `${publicEnv.BASE_ENDPOINT}/memes-preview.png`,
    description: "Collections",
    twitterCard: "summary_large_image",
  });
}
