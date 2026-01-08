import styles from "@/styles/Home.module.scss";

import MemeLabCollection from "@/components/memelab/MemeLabCollection";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import type { Metadata } from "next";

export default async function MemeLabCollectionPage({
  params,
}: {
  readonly params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  return (
    <main className={styles["main"]}>
      <MemeLabCollection collectionName={collection.replaceAll("-", " ")} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const collectionName = collection.replaceAll("-", " ");
  return getAppMetadata({
    title: `${collectionName} | Meme Lab Collections`,
    description: "Collections",
    ogImage: `${publicEnv.BASE_ENDPOINT}/meme-lab.jpg`,
    twitterCard: "summary",
  });
}
