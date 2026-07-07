import GradientsComponent from "@/components/6529Gradient/6529Gradient";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildCollectionPageJsonLd } from "@/lib/structured-data/nft";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";
import { Suspense } from "react";

function GradientsFallback() {
  return <div className="tailwind-scope tw-min-h-dvh tw-bg-black" />;
}

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
      <Suspense fallback={<GradientsFallback />}>
        <GradientsComponent />
      </Suspense>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "6529 Gradient | Collections",
      description: "Collections",
      ogImage: getCollectionSocialCardImagePath("6529-gradient"),
      ogImageAlt: "6529 Gradient collection social card",
    })
  );
}
